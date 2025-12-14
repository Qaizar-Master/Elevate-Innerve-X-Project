
import React from 'react';

// --- Messaging & Content ---
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  type: 'text' | 'image' | 'video' | 'mixed';
  imageUrl?: string;
  videoUrl?: string;
  storyboardUrl?: string;
  timestamp: number;
}

export type QuestionType = 'MCQ' | 'SHORT_ANSWER' | 'LONG_ANSWER' | 'NUMERICAL';

export interface Question {
  id: string;
  type: QuestionType;
  questionText: string;
  options?: string[];
  correctAnswer?: string; 
  userAnswer?: string;
  explanation?: string;
}

export interface StudyPlan {
  topic: string;
  summary: string;
  keyConcepts: string[];
  practiceQuestions: Question[];
  estimatedTime: string;
}

export interface MistakeAnalysis {
  summary: string;
  patterns: {
    category: 'CONCEPT_GAP' | 'CALCULATION_ERROR' | 'LOGIC_ERROR' | 'MEMORY_LAPSE';
    description: string;
    suggestion: string;
  }[];
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface SmartNotes {
  summary: string;
  mindMapMarkdown: string;
  flashcards: Flashcard[];
}

export interface CodeAnalysis {
  correctedCode: string;
  explanation: string;
  flowchartMermaid: string;
  outputSimulation: string;
}

// --- Dynamic Progress & Mastery ---

export type MasteryLabel = 'Mastered' | 'Proficient' | 'Learning' | 'Needs Review';

export interface SkillMastery {
  skillId: string;
  name: string;
  masteryScore: number; // 0-100
  masteryConfidence: number; // 0-100
  masteryLabel: MasteryLabel;
  lastUpdate: string;
  ewmaRaw: number; // Internal metric 0-1
  nextRecommendation: {
    type: 'microlesson' | 'quiz' | 'project';
    id: string;
    title: string;
    spacingDays: number;
  };
}

export interface HeatmapDay {
  date: string;
  intensity: 0 | 1 | 2 | 3 | 4;
  minutes: number;
  count: number;
}

export interface ConceptNode {
  id: string;
  label: string;
  status: 'locked' | 'unlocked' | 'mastered';
  masteryScore: number;
  x: number;
  y: number;
  connections: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  icon: string;
}

// --- API Keys & Security ---

export interface ApiKey {
  id: string;
  name: string;
  prefix: string; // e.g., "sk-prod"
  maskedKey: string; // "****-1234"
  scopes: string[];
  createdAt: string;
  lastUsed?: string;
  status: 'active' | 'revoked';
}

export interface SecurityActivity {
  id: string;
  action: string; // e.g., "LOGIN", "KEY_ROTATED"
  device: string;
  location: string;
  timestamp: string;
}

export interface UserPreferences {
  adaptiveDifficulty: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  dataSharing: boolean; // Cohort analysis
  theme: 'light' | 'dark' | 'system';
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string; // New field
  className?: string; // New field
  board?: string; // New field (CBSE, ICSE, etc.)
  role: UserRole;
  preferences: UserPreferences;
}

// --- Library & File Management (New) ---

export type FileType = 'PDF' | 'IMAGE' | 'VIDEO' | 'DOC' | 'OTHER';

export interface LibraryFile {
  id: string;
  name: string;
  type: FileType;
  size: string;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
  folderId?: string;
  tags: string[];
  status: 'uploading' | 'processing' | 'ready' | 'error';
  // AI Extracted Meta
  summary?: string;
  difficultyRating?: 'Easy' | 'Medium' | 'Hard';
  topic?: string;
}

export interface LibraryFolder {
  id: string;
  name: string;
  color?: string;
  fileCount: number;
}

export interface TestConfig {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionCount: number;
  sources: string[]; // IDs of files or 'all'
  topic?: string; // Optional topic override
}

export interface TestResult {
  score: number;
  totalQuestions: number;
  correctCount: number;
  timeTaken: string;
  topicAccuracy: { topic: string; accuracy: number }[];
  feedback: {
    weakness: string;
    advice: string;
    recommendedAction: string;
  }[];
}


// --- Main Stats Object ---

export interface UserStats {
  userId: string;
  masteryScore: number;
  questionsSolved: number;
  streakDays: number;
  xp: number;
  level: number;
  nextLevelXp: number;
  weeklyGrowth: number; // Percentage delta
  
  // Detailed Components
  skills: SkillMastery[]; // For the Wheel
  heatmapData: HeatmapDay[];
  conceptTree: ConceptNode[];
  strengths: string[];
  weakAreas: { topic: string; fixId: string; fixTitle: string }[];
  achievements: Achievement[];
  
  recentMistakes: string[]; // Legacy field support
  subjectMastery: any[]; // Legacy field support for simple charts
}

// --- App Navigation ---

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT',
  TEST_GENERATOR = 'TEST_GENERATOR', // Renamed from STUDY_PLAN used for quiz
  NOTES_LIBRARY = 'NOTES_LIBRARY',   // Renamed/Repurposed
  CODING = 'CODING',
  TEACHER = 'TEACHER',
  TIME_TRAVEL = 'TIME_TRAVEL',
  SETTINGS = 'SETTINGS'
}

export type Emotion = 'CONFUSED' | 'BORED' | 'STRESSED' | 'NEUTRAL' | 'HAPPY';
export type TutorMode = 'STANDARD' | 'SIMPLIFIER' | 'CHALLENGER' | 'ZEN';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface NavBadge {
  text: string;
  color: 'red' | 'blue' | 'green' | 'yellow';
}

export interface NavItemConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  view?: AppView; 
  viewProps?: Record<string, any>;
  role?: UserRole[];
  badge?: NavBadge;
  subItems?: NavItemConfig[];
  shortcut?: string;
  pinned?: boolean;
}

// --- Backend Types ---

export interface DBFile {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
}

export type BackendJobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface BackgroundJob {
  id: string;
  type: string;
  status: BackendJobStatus;
  progress: number;
  createdAt: string;
  result?: any;
  error?: string;
}

export interface Test {
  id: string;
  userId: string;
  title: string;
  configJson: any;
  status: 'ready' | 'pending';
  generatedAt: string;
  studyPlan?: StudyPlan; // Keeping for backward compat in services
  smartNotes?: SmartNotes;
}
