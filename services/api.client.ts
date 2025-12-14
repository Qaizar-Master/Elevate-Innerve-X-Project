
import { DBFile, Test, BackgroundJob, BackendJobStatus, UserStats, SkillMastery, ApiKey, SecurityActivity, UserPreferences, HeatmapDay, LibraryFile, LibraryFolder, TestConfig, TestResult, UserProfile, Question } from '../types';
import { generateStudyPlanFromPDF, generateSmartNotes } from './gemini';
import { GoogleGenAI, Type } from "@google/genai";
import * as pdfjsLib from "pdfjs-dist";

// Handle module import structure differences
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// Init PDF Worker
if (typeof window !== 'undefined' && pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

// Mock Data Stores
let mockLibraryFiles: LibraryFile[] = []; 

const mockFolders: LibraryFolder[] = [
    { id: 'fol1', name: 'Class 10 Science', fileCount: 0, color: '#1E3A8A' },
    { id: 'fol2', name: 'Math Homework', fileCount: 0, color: '#059669' }
];

// In-memory cache for content
const fileContentCache: Record<string, any> = {};

// Mock User Profile
let mockProfile: UserProfile = {
    id: 'u_123',
    name: 'Student User',
    email: 'student@example.com',
    role: 'student',
    preferences: {
        adaptiveDifficulty: true,
        emailNotifications: false,
        pushNotifications: true,
        dataSharing: true,
        theme: 'light'
    }
};

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  // --- USER PROFILE ---
  async getUserProfile(): Promise<UserProfile> {
      return new Promise(resolve => setTimeout(() => resolve({...mockProfile}), 300));
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
      mockProfile = { ...mockProfile, ...updates };
      return new Promise(resolve => setTimeout(() => resolve({...mockProfile}), 500));
  }

  // --- LIBRARY MANAGEMENT ---

  async getLibraryFiles(): Promise<LibraryFile[]> {
      return [...mockLibraryFiles];
  }

  async getFolders(): Promise<LibraryFolder[]> {
      mockFolders.forEach(folder => {
          folder.fileCount = mockLibraryFiles.filter(f => f.folderId === folder.id).length;
      });
      return [...mockFolders];
  }

  async uploadLibraryFile(file: File): Promise<LibraryFile> {
      const newFile: LibraryFile = {
          id: `f_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          type: file.type.includes('pdf') ? 'PDF' : file.type.includes('image') ? 'IMAGE' : file.type.includes('video') ? 'VIDEO' : 'OTHER',
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          url: URL.createObjectURL(file), 
          createdAt: new Date().toISOString(),
          tags: [], 
          status: 'uploading'
      };
      
      mockLibraryFiles.unshift(newFile);
      await this.processFile(newFile, file);
      return newFile;
  }

  private async processFile(fileRecord: LibraryFile, rawFile: File) {
      const idx = mockLibraryFiles.findIndex(f => f.id === fileRecord.id);
      if (idx > -1) mockLibraryFiles[idx].status = 'processing';

      try {
          if (rawFile.type.includes('pdf')) {
             const reader = new FileReader();
             return new Promise<void>((resolve) => {
                 reader.readAsDataURL(rawFile);
                 reader.onloadend = async () => {
                     const base64 = (reader.result as string)?.split(',')[1];
                     if (base64) {
                         try {
                             const text = await this.extractTextFromPDF(base64);
                             if (text) {
                                 fileContentCache[fileRecord.id + '_text'] = text;
                             }
                             const notes = await generateSmartNotes(base64, rawFile.name);
                             fileContentCache[fileRecord.id] = notes;
                             fileContentCache[fileRecord.id + '_raw'] = base64;
                             
                             this.updateFileStatus(fileRecord.id, 'ready', notes.summary.substring(0, 100) + '...');
                             resolve();
                         } catch (e) {
                             console.error("AI generation failed", e);
                             this.setGenericContent(fileRecord.id, "AI analysis failed.");
                             resolve();
                         }
                     } else {
                         resolve();
                     }
                 };
             });
          } else {
              this.setGenericContent(fileRecord.id, "Visual content ready.");
              return Promise.resolve();
          }
      } catch (e) {
          console.error("Processing error", e);
          this.setGenericContent(fileRecord.id, "Error during processing.");
          return Promise.resolve();
      }
  }

  private updateFileStatus(id: string, status: 'ready' | 'error', summary?: string) {
      const idx = mockLibraryFiles.findIndex(f => f.id === id);
      if (idx > -1) {
          mockLibraryFiles[idx].status = status;
          if (summary) mockLibraryFiles[idx].summary = summary;
      }
  }

  private setGenericContent(id: string, message: string) {
      const idx = mockLibraryFiles.findIndex(f => f.id === id);
      if (idx > -1) {
          mockLibraryFiles[idx].status = 'ready';
          mockLibraryFiles[idx].summary = message;
          fileContentCache[id] = {
              summary: message,
              mindMapMarkdown: "- Content unavailable",
              flashcards: []
          };
      }
  }

  async getFileSmartContent(fileId: string): Promise<any> {
      return fileContentCache[fileId] || null;
  }

  async getFileRawContent(fileId: string): Promise<string | null> {
      return fileContentCache[fileId + '_raw'] || null;
  }

  async deleteLibraryFile(id: string): Promise<void> {
      const idx = mockLibraryFiles.findIndex(f => f.id === id);
      if (idx > -1) mockLibraryFiles.splice(idx, 1);
  }

  async renameLibraryFile(id: string, newName: string): Promise<void> {
      const idx = mockLibraryFiles.findIndex(f => f.id === id);
      if (idx > -1) mockLibraryFiles[idx].name = newName;
  }

  public async extractTextFromPDF(base64: string): Promise<string> {
      try {
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
          }
          
          const loadingTask = pdfjs.getDocument({ data: bytes });
          const pdf = await loadingTask.promise;
          let fullText = "";
          
          const maxPages = Math.min(pdf.numPages, 20);
          for (let i = 1; i <= maxPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map((item: any) => item.str).join(' ');
              fullText += `\n--- Page ${i} ---\n${pageText}`;
          }
          return fullText;
      } catch (e) {
          console.error("PDF Extraction failed", e);
          return "";
      }
  }

  // --- HYBRID TEST GENERATION ---

  async generateStrictTest(config: TestConfig): Promise<Test> {
      // 1. Resolve Sources
      const sourceFiles = config.sources.includes('all') 
          ? mockLibraryFiles.filter(f => f.status === 'ready' && f.type === 'PDF') 
          : mockLibraryFiles.filter(f => config.sources.includes(f.id));
      
      // 2. Extract Text
      let aggregatedText = "";
      for (const file of sourceFiles) {
          let text = fileContentCache[file.id + '_text'];
          if (!text) {
               const rawBase64 = fileContentCache[file.id + '_raw'];
               if (rawBase64) {
                   text = await this.extractTextFromPDF(rawBase64);
                   fileContentCache[file.id + '_text'] = text;
               }
          }
          if (text) {
              aggregatedText += `\n\n=== SOURCE: ${file.name} ===\n${text}`;
          }
      }

      // 3. Construct Prompt (Hybrid Mode)
      let prompt = "";
      let title = "";
      
      if (aggregatedText.length > 50) {
          title = `Test: ${sourceFiles.map(f => f.name).join(', ').substring(0, 30)}...`;
          prompt = `
          Create a test based ONLY on the following content:

          CONTENT:
          ${aggregatedText.substring(0, 45000)}

          RULES:
          - Generate exactly ${config.questionCount} MCQs
          - Each question MUST come from the above content
          - Difficulty: ${config.difficulty}
          `;
      } else if (config.topic && config.topic.trim().length > 0) {
          title = `Test: ${config.topic}`;
          prompt = `
          Create a test about: "${config.topic}".
          
          RULES:
          - Generate exactly ${config.questionCount} MCQs
          - Questions should be academic and relevant to the topic.
          - Difficulty: ${config.difficulty}
          `;
      } else {
           throw new Error("Please select a valid PDF file or enter a topic.");
      }

      prompt += `
      - IMPORTANT: Output strictly as a JSON array of objects.
      - Schema:
        [
          {
            "questionText": "Question string",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswerIndex": 0, // 0-3 integer
            "explanation": "Explanation string",
            "topic": "Subtopic name"
          }
        ]
      `;

      // 4. Call AI
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
              responseMimeType: 'application/json',
              responseSchema: {
                  type: Type.ARRAY,
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          questionText: { type: Type.STRING },
                          options: { type: Type.ARRAY, items: { type: Type.STRING } },
                          correctAnswerIndex: { type: Type.INTEGER },
                          explanation: { type: Type.STRING },
                          topic: { type: Type.STRING }
                      }
                  }
              }
          }
      });

      let questions: Question[] = [];
      if (response.text) {
          const rawQuestions = JSON.parse(response.text);
          questions = rawQuestions.map((q: any, i: number) => ({
              id: `q_${Date.now()}_${i}`,
              type: 'MCQ',
              questionText: q.questionText,
              options: q.options,
              correctAnswer: q.options[q.correctAnswerIndex], 
              correctAnswerIndex: q.correctAnswerIndex, 
              explanation: q.explanation,
              topic: q.topic || 'General'
          }));
      } else {
          throw new Error("Failed to generate questions. Please try again.");
      }

      const test: Test = {
          id: `test_${Date.now()}`,
          userId: 'user_1',
          title: title,
          configJson: config,
          status: 'ready',
          generatedAt: new Date().toISOString(),
          studyPlan: {
              topic: "Generated Quiz",
              summary: aggregatedText.length > 50 ? 'Test based on PDF content.' : `Test based on topic: ${config.topic}`,
              keyConcepts: [],
              practiceQuestions: questions,
              estimatedTime: `${config.questionCount * 1.5} mins`
          }
      };
      return test;
  }

  async submitTest(testId: string, answers: Record<string, string>, originalQuestions: Question[]): Promise<TestResult> {
      await new Promise(r => setTimeout(r, 500));
      
      let correctCount = 0;
      const topicStats: Record<string, { total: number, correct: number }> = {};
      const mistakes: any[] = [];

      originalQuestions.forEach(q => {
          const userAns = (answers[q.id] || "").trim();
          let isCorrect = false;
          
          if ((q as any).correctAnswerIndex !== undefined && q.options) {
             const correctIdx = (q as any).correctAnswerIndex;
             const userIdx = q.options.indexOf(userAns);
             if (userIdx === correctIdx) isCorrect = true;
          } else {
             if (userAns === q.correctAnswer) isCorrect = true;
          }

          const topic = (q as any).topic || "General";
          if (!topicStats[topic]) topicStats[topic] = { total: 0, correct: 0 };
          topicStats[topic].total++;

          if (isCorrect) {
              correctCount++;
              topicStats[topic].correct++;
          } else {
              mistakes.push({
                  question: q.questionText,
                  topic: topic,
                  userAnswer: userAns,
                  correctAnswer: q.correctAnswer
              });
          }
      });

      const score = originalQuestions.length > 0 ? Math.round((correctCount / originalQuestions.length) * 100) : 0;
      
      const topicAccuracy = Object.keys(topicStats).map(t => ({
          topic: t,
          accuracy: Math.round((topicStats[t].correct / topicStats[t].total) * 100)
      }));

      const feedback = [];
      if (mistakes.length > 0) {
          const mistakesByTopic: Record<string, number> = {};
          mistakes.forEach(m => {
              mistakesByTopic[m.topic] = (mistakesByTopic[m.topic] || 0) + 1;
          });
          const worstTopic = Object.keys(mistakesByTopic).reduce((a, b) => mistakesByTopic[a] > mistakesByTopic[b] ? a : b);
          feedback.push({
              weakness: worstTopic,
              advice: `You missed ${mistakesByTopic[worstTopic]} questions in ${worstTopic}.`,
              recommendedAction: `Review the material on ${worstTopic}.`
          });
      } else {
          feedback.push({
              weakness: "None",
              advice: "Perfect score!",
              recommendedAction: "Try a Harder difficulty."
          });
      }

      return {
          score,
          totalQuestions: originalQuestions.length,
          correctCount,
          timeTaken: '5m 00s', 
          topicAccuracy,
          feedback
      };
  }

  // --- API KEY METHODS ---
  private mockApiKeys: ApiKey[] = [];
  async getApiKeys(): Promise<ApiKey[]> { return this.mockApiKeys; }
  async createApiKey(name: string, scopes: string[]): Promise<{ apiKey: ApiKey, secret: string }> { return { apiKey: { id: '1', name, prefix: 'sk', maskedKey: '***', scopes, createdAt: '', status: 'active' }, secret: 'sk-123' }; }
  async revokeApiKey(id: string): Promise<void> {}
  async rotateApiKey(id: string): Promise<{ apiKey: ApiKey, secret: string }> { return this.createApiKey('Rotated', []); }
  async getSecurityLog(): Promise<SecurityActivity[]> { return []; }

  async getUserStats(): Promise<UserStats> {
      return new Promise(resolve => setTimeout(() => resolve({
          userId: 'user_123',
          masteryScore: 78,
          questionsSolved: 1240,
          streakDays: 12,
          xp: 4500,
          level: 15,
          nextLevelXp: 5000,
          weeklyGrowth: 8.5,
          skills: [
              { skillId: 's1', name: 'Physics', masteryScore: 85, masteryConfidence: 90, masteryLabel: 'Mastered', lastUpdate: '', ewmaRaw: 0.85, nextRecommendation: { type: 'quiz', id: '1', title: 'Adv Mechanics', spacingDays: 2 } },
              { skillId: 's2', name: 'Chemistry', masteryScore: 65, masteryConfidence: 70, masteryLabel: 'Proficient', lastUpdate: '', ewmaRaw: 0.65, nextRecommendation: { type: 'quiz', id: '2', title: 'Organic Chem', spacingDays: 1 } },
              { skillId: 's3', name: 'Math', masteryScore: 45, masteryConfidence: 50, masteryLabel: 'Learning', lastUpdate: '', ewmaRaw: 0.45, nextRecommendation: { type: 'microlesson', id: '3', title: 'Calculus Basics', spacingDays: 0 } },
              { skillId: 's4', name: 'Biology', masteryScore: 92, masteryConfidence: 95, masteryLabel: 'Mastered', lastUpdate: '', ewmaRaw: 0.92, nextRecommendation: { type: 'project', id: '4', title: 'Genetics', spacingDays: 5 } },
              { skillId: 's5', name: 'History', masteryScore: 70, masteryConfidence: 75, masteryLabel: 'Proficient', lastUpdate: '', ewmaRaw: 0.70, nextRecommendation: { type: 'quiz', id: '5', title: 'World War II', spacingDays: 3 } }
          ],
          heatmapData: [],
          conceptTree: [],
          strengths: ['Physics', 'Biology'],
          weakAreas: [
              { topic: 'Calculus', fixId: 'fx1', fixTitle: 'Derivatives Practice' },
              { topic: 'Organic Chemistry', fixId: 'fx2', fixTitle: 'Reaction Mechanisms' }
          ],
          achievements: [],
          recentMistakes: [],
          subjectMastery: []
      }), 500));
  }
}

export const api = new ApiClient();
