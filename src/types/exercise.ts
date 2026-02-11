export type CommunicationSubscore =
  | "fluency"
  | "clarity"
  | "precision"
  | "confidence"
  | "impact";

export interface CommunicationScore {
  overall: number; // 0-100
  fluency: number | null;
  clarity: number | null;
  precision: number | null;
  confidence: number | null;
  impact: number | null;
  lastUpdated: Date;
}

export interface UserArchetype {
  id: string;
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  recommendedExercises: string[];
}

export interface ExerciseAttempt {
  id: string;
  exerciseId: string;
  userId: string;
  timestamp: Date;
  duration: number; // seconds
  score: number; // 0-100
  metrics: Record<string, unknown>;
  impactedScores: CommunicationSubscore[];
  xpEarned: number;
}

export interface UserProgress {
  userId: string;
  communicationScore: CommunicationScore;
  archetype: UserArchetype;
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null; // ISO date (yyyy-mm-dd)
  totalXP: number;
  totalSessions: number;
  totalPracticeTime: number; // seconds
  achievements: string[];
}

export interface ExerciseConfig {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  estimatedTime: number; // seconds
  type: "verbal" | "written" | "both";
  category: string;
  tier: "foundation" | "intermediate" | "advanced";
  icon: string;
  impactsScores: CommunicationSubscore[];
}
