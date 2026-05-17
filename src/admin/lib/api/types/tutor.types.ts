import type { Identifiable, Timestamps } from "./common.types";

// === Tutor Dashboard ===
export interface TutorDashboard {
  activeLearningPaths: number;
  completedLessons: number;
  totalLessons: number;
  currentStreak: number;
  totalXp: number;
  level: number;
  levelTitle: string;
  weeklyGoal: { target: number; completed: number };
  weaknesses: WeaknessArea[];
  recentActivity: TutorActivityItem[];
  recommendedLessons: RecommendedLesson[];
  skillProgress: { skill: string; before: number; after: number; lessonsCompleted: number }[];
}

export interface WeaknessArea {
  skill: string;
  score: number;
  benchmark: number;
  gap: number;
  suggestedLessons: number;
  priority: "high" | "medium" | "low";
}

export interface TutorActivityItem {
  id: string;
  type: "lesson_completed" | "quiz_passed" | "path_started" | "milestone_reached" | "streak_achieved";
  title: string;
  description: string;
  timestamp: string;
  xpEarned?: number;
}

export interface RecommendedLesson {
  id: string;
  title: string;
  skill: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number; // minutes
  type: "video" | "reading" | "exercise" | "quiz" | "project";
  matchReason: string;
  completionRate: number; // % of students who completed this
}

// === Learning Paths ===
export interface LearningPath extends Identifiable, Timestamps {
  title: string;
  description: string;
  skill: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  totalModules: number;
  completedModules: number;
  estimatedHours: number;
  status: "not_started" | "in_progress" | "completed" | "paused";
  modules: LearningModule[];
  prerequisites: string[];
  outcomes: string[];
  progress: number; // 0-100
  author?: string;
}

export interface LearningModule extends Identifiable {
  title: string;
  description: string;
  order: number;
  type: "lesson" | "quiz" | "assignment" | "project";
  duration: number; // minutes
  status: "locked" | "available" | "in_progress" | "completed";
  score?: number;
  maxScore?: number;
  completedAt?: string;
  resources: LearningResource[];
}

export interface LearningResource {
  id: string;
  title: string;
  type: "video" | "article" | "pdf" | "interactive" | "external_link";
  url: string;
  duration?: number;
}

// === Tutor Session ===
export interface TutorSession extends Identifiable, Timestamps {
  moduleId: string;
  moduleName: string;
  pathId: string;
  pathName: string;
  skill: string;
  content: SessionContent;
  quiz?: SessionQuiz;
  status: "in_progress" | "completed";
  startedAt: string;
  completedAt?: string;
  score?: number;
  feedback?: AiTutorFeedback;
}

export interface SessionContent {
  type: "lesson" | "exercise" | "project";
  title: string;
  sections: ContentSection[];
}

export interface ContentSection {
  id: string;
  title: string;
  type: "text" | "code" | "video" | "interactive";
  content: string;
  completed: boolean;
}

export interface SessionQuiz {
  questions: QuizQuestion[];
  passingScore: number;
  attempts: number;
  maxAttempts: number;
  bestScore?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: "multiple_choice" | "true_false" | "short_answer";
  options?: string[];
  correctAnswer?: string;
  userAnswer?: string;
  isCorrect?: boolean;
  explanation?: string;
}

export interface AiTutorFeedback {
  overallScore: number;
  strengths: string[];
  areasToImprove: string[];
  nextSteps: string[];
  encouragement: string;
}

// === Start Session Request ===
export interface StartSessionRequest {
  moduleId: string;
  pathId: string;
}

export interface SubmitQuizRequest {
  sessionId: string;
  answers: { questionId: string; answer: string }[];
}

// === Tutor Preferences ===
export interface TutorPreferences {
  weeklyGoalTarget: number;
}

// === Bookmarks ===
export interface TutorBookmark extends Identifiable {
  sectionId: string;
  sectionTitle: string;
  pathTitle: string;
  skill: string;
  createdAt: string;
}
