
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { StudyPlan, MistakeAnalysis, Question, SmartNotes, CodeAnalysis, Emotion } from "../types";

// Helper to ensure API key presence
const getAIClient = async () => {
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      // Handle if needed - usually handled by UI button
    }
  }
  const key = process.env.API_KEY;
  if (!key) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey: key });
};

// Helper to clean base64 string (remove data URL prefix if present)
const cleanBase64 = (base64: string) => {
  if (base64.includes(',')) {
    return base64.split(',')[1];
  }
  return base64;
};

// Robust Wrapper for API Calls with Retry Logic
async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (retries > 0 && (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota'))) {
      console.warn(`Rate limited. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryOperation(operation, retries - 1, delay * 2);
    }
    console.error("Gemini API Error:", JSON.stringify(error, null, 2));
    throw error;
  }
}

// --- CORE SERVICES ---

export const generateStudyPlanFromPDF = async (
  pdfBase64: string,
  fileName: string
): Promise<StudyPlan> => {
  return retryOperation(async () => {
    const ai = await getAIClient();

    const prompt = `Analyze this document (${fileName}). Create a comprehensive question paper and study plan.
      Include:
      1. A summary of the chapter.
      2. Key concepts.
      3. A mix of questions: 3 MCQs, 1 Short Answer, and 1 Numerical/Logical problem if applicable.
      For MCQs, provide 4 options. For others, provide the model answer in 'correctAnswer'.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: cleanBase64(pdfBase64)
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            summary: { type: Type.STRING },
            estimatedTime: { type: Type.STRING },
            keyConcepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            practiceQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['MCQ', 'SHORT_ANSWER', 'LONG_ANSWER', 'NUMERICAL'] },
                  questionText: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    if (!response.text) throw new Error("No text returned from AI");
    return JSON.parse(response.text) as StudyPlan;
  });
};

export const generateFutureExam = async (weakTopics: string[]): Promise<StudyPlan> => {
  return retryOperation(async () => {
    const ai = await getAIClient();
    const prompt = `You are a Time-Travel Exam Simulator. 
      The student is predicted to fail in these topics: ${weakTopics.join(', ')}.
      
      Generate a "Future Exam Paper" that targets these specific weaknesses.
      1. Title: "Simulated Final Exam - [Date + 3 Months]"
      2. Summary: "Predicted Outcome: Failure (unless score > 80%)"
      3. Questions: 5 Very Hard, Tricky Questions (MCQ & Logic).
      
      Return JSON with 'practiceQuestions' array.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            summary: { type: Type.STRING },
            estimatedTime: { type: Type.STRING },
            keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
            practiceQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['MCQ', 'SHORT_ANSWER', 'LONG_ANSWER', 'NUMERICAL'] },
                  questionText: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    if (!response.text) throw new Error("No text returned from AI");
    return JSON.parse(response.text) as StudyPlan;
  });
};

export const analyzeMistakes = async (
  questions: Question[]
): Promise<MistakeAnalysis> => {
  return retryOperation(async () => {
    const ai = await getAIClient();

    const wrongQuestions = questions.filter(q => q.userAnswer && q.userAnswer !== q.correctAnswer);
    if (wrongQuestions.length === 0) {
      return {
        summary: "Perfect score! No mistakes detected.",
        patterns: []
      };
    }

    const prompt = `Analyze the following student mistakes and identify learning gaps.
      Questions missed: ${JSON.stringify(wrongQuestions.map(q => ({
      question: q.questionText,
      studentAnswer: q.userAnswer,
      correctAnswer: q.correctAnswer,
      type: q.type
    })))}
      
      Categorize the errors (Concept Gap, Calculation, Logic, Memory) and give specific suggestions.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            patterns: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, enum: ['CONCEPT_GAP', 'CALCULATION_ERROR', 'LOGIC_ERROR', 'MEMORY_LAPSE'] },
                  description: { type: Type.STRING },
                  suggestion: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    if (!response.text) throw new Error("No text returned from AI");
    return JSON.parse(response.text) as MistakeAnalysis;
  });
};

export const generateSmartNotes = async (
  pdfBase64: string,
  fileName: string
): Promise<SmartNotes> => {
  return retryOperation(async () => {
    const ai = await getAIClient();
    const prompt = `Create study materials for ${fileName}.
        1. A detailed summary.
        2. A markdown list representing a mind map structure.
        3. 5 Flashcards (Front/Back).`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [{ inlineData: { mimeType: 'application/pdf', data: cleanBase64(pdfBase64) } }, { text: prompt }]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            mindMapMarkdown: { type: Type.STRING },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    if (!response.text) throw new Error("No text returned from AI");
    return JSON.parse(response.text) as SmartNotes;
  });
};

export const analyzeCode = async (code: string): Promise<CodeAnalysis> => {
  return retryOperation(async () => {
    const ai = await getAIClient();
    const prompt = `Analyze this code. 
        1. Fix bugs.
        2. Explain the logic.
        3. Simulate the output.
        4. Generate a Mermaid flowchart syntax for the logic.
        
        Code:
        ${code}`;

    // Priority 1: Try with the powerful model (User Preferred)
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            correctedCode: { type: Type.STRING },
            explanation: { type: Type.STRING },
            flowchartMermaid: { type: Type.STRING },
            outputSimulation: { type: Type.STRING }
          }
        },
        thinkingConfig: { thinkingBudget: 16384 }
      }
    });

    if (!response.text) throw new Error("No text returned from AI");
    return JSON.parse(response.text) as CodeAnalysis;
  });
};

// --- EMOTION RECOGNITION ---

export const detectMood = async (imageBase64: string): Promise<Emotion> => {
  return retryOperation(async () => {
    const ai = await getAIClient();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(imageBase64) } },
            { text: "Analyze the facial expression of the student. Return only ONE word from this list: CONFUSED, BORED, STRESSED, NEUTRAL, HAPPY." }
          ]
        }
      });
      const text = response.text?.trim().toUpperCase();
      if (['CONFUSED', 'BORED', 'STRESSED', 'NEUTRAL', 'HAPPY'].includes(text || '')) {
        return text as Emotion;
      }
      return 'NEUTRAL';
    } catch (e: any) {
      console.warn("Mood detection failed or rate limited", e);
      return 'NEUTRAL';
    }
  });
};

// --- CHAT & MEDIA ---

export const chatWithTutor = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  image?: string,
  useDeepReasoning: boolean = false,
  systemInstructionAddon: string = ""
): Promise<string> => {
  return retryOperation(async () => {
    const ai = await getAIClient();

    const model = useDeepReasoning ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';
    // thinkingBudget must be integer, careful not to exceed limits
    const thinkingConfig = useDeepReasoning ? { thinkingConfig: { thinkingBudget: 16384 } } : {};

    const baseInstruction = `You are Elevate, a highly intelligent and professional AI learning assistant.
          - If asked for a process/algorithm, generate a Mermaid flowchart using \`\`\`mermaid ... \`\`\`.
          - If asked for code, provide a corrected, clean code block.
          - Be concise, professional, and encouraging.`;

    const chat = ai.chats.create({
      model: model,
      history: history,
      config: {
        systemInstruction: `${baseInstruction}\n\n${systemInstructionAddon}`,
        ...thinkingConfig
      }
    });

    const msgParts: any[] = [{ text: message }];
    if (image) {
      msgParts.unshift({
        inlineData: {
          data: cleanBase64(image),
          mimeType: 'image/jpeg'
        }
      });
    }

    const result = await chat.sendMessage({
      message: msgParts
    });

    return result.text || "I couldn't generate a response.";
  });
};

export const generateDiagram = async (prompt: string): Promise<string | null> => {
  try {
    const ai = await getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Create a clear, professional technical diagram, map, or 3D illustration explaining: ${prompt}. White background, high detail, clean lines.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (e) {
    console.error("Diagram generation failed", e);
  }
  return null;
};

export const generateStoryboard = async (prompt: string): Promise<string | null> => {
  try {
    const ai = await getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{
          text: `Generate a sequential 4-panel educational comic strip explaining: "${prompt}".
        Style: High-quality flat vector art style, vibrant colors.
        Grid: 2x2.
        Panels: Setup, Process, Application, Summary.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (e) {
    console.error("Storyboard generation failed", e);
  }
  return null;
};

export const generateEducationalVideo = async (topic: string): Promise<string | null> => {
  try {
    if (window.aistudio && window.aistudio.openSelectKey) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
    }

    const ai = await getAIClient();
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Professional educational explainer video, clear animation, demonstrating: ${topic}. 3D style, high detail.`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (uri) {
      return `${uri}&key=${process.env.API_KEY}`;
    }
  } catch (e) {
    console.error("Video generation failed", e);
  }
  return null;
};

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}
