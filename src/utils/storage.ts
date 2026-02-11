import type {
  CommunicationScore,
  CommunicationSubscore,
  ExerciseAttempt,
  UserArchetype,
  UserProgress,
} from "@/types/exercise";
import { determineArchetype, DEFAULT_ARCHETYPE } from "@/data/archetypes";

const PROGRESS_KEY_PREFIX = "user_progress:";
const ATTEMPTS_KEY_PREFIX = "exercise_attempts:";

function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const key = "__storage_test__";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function safeGetItem(key: string): string | null {
  if (!isStorageAvailable()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore quota / privacy errors.
  }
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dateDiffInDays(a: string, b: string): number {
  const aDate = new Date(`${a}T00:00:00Z`);
  const bDate = new Date(`${b}T00:00:00Z`);
  const diff = bDate.getTime() - aDate.getTime();
  return Math.round(diff / (24 * 60 * 60 * 1000));
}

function defaultScore(): CommunicationScore {
  return {
    overall: 0,
    fluency: null,
    clarity: null,
    precision: null,
    confidence: null,
    impact: null,
    lastUpdated: new Date(),
  };
}

function defaultProgress(userId: string): UserProgress {
  const score = defaultScore();
  const archetype = determineArchetype(score) ?? DEFAULT_ARCHETYPE;
  return {
    userId,
    communicationScore: score,
    archetype,
    currentStreak: 0,
    longestStreak: 0,
    lastPracticeDate: null,
    totalXP: 0,
    totalSessions: 0,
    totalPracticeTime: 0,
    achievements: [],
  };
}

function parseProgress(raw: string | null, userId: string): UserProgress {
  if (!raw) return defaultProgress(userId);
  try {
    const parsed = JSON.parse(raw) as UserProgress;
    const score = parsed.communicationScore;
    return {
      ...parsed,
      userId,
      communicationScore: {
        ...score,
        lastUpdated: new Date(score.lastUpdated),
      },
    };
  } catch {
    return defaultProgress(userId);
  }
}

function parseAttempts(raw: string | null): ExerciseAttempt[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ExerciseAttempt[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((attempt) => ({
      ...attempt,
      timestamp: new Date(attempt.timestamp),
    }));
  } catch {
    return [];
  }
}

function setProgress(userId: string, progress: UserProgress): void {
  safeSetItem(`${PROGRESS_KEY_PREFIX}${userId}`, JSON.stringify(progress));
}

function setAttempts(userId: string, attempts: ExerciseAttempt[]): void {
  safeSetItem(`${ATTEMPTS_KEY_PREFIX}${userId}`, JSON.stringify(attempts));
}

export function saveUserProgress(userId: string, progress: UserProgress): void {
  setProgress(userId, progress);
}

export function getUserProgress(userId: string): UserProgress {
  const raw = safeGetItem(`${PROGRESS_KEY_PREFIX}${userId}`);
  return parseProgress(raw, userId);
}

export function saveExerciseAttempt(userId: string, attempt: ExerciseAttempt): void {
  const attempts = getExerciseHistory(userId);
  attempts.push(attempt);
  setAttempts(userId, attempts);
}

export function getExerciseHistory(userId: string): ExerciseAttempt[] {
  const raw = safeGetItem(`${ATTEMPTS_KEY_PREFIX}${userId}`);
  return parseAttempts(raw);
}

export function getExerciseAttempts(userId: string, exerciseId: string): ExerciseAttempt[] {
  return getExerciseHistory(userId).filter((attempt) => attempt.exerciseId === exerciseId);
}

export function updateStreak(progress: UserProgress, practiceDate = new Date()): UserProgress {
  const today = toDateKey(practiceDate);
  const last = progress.lastPracticeDate;

  if (!last) {
    const next = { ...progress, currentStreak: 1, longestStreak: Math.max(1, progress.longestStreak), lastPracticeDate: today };
    return next;
  }

  const diff = dateDiffInDays(last, today);
  if (diff === 0) return progress;
  if (diff === 1) {
    const currentStreak = progress.currentStreak + 1;
    return {
      ...progress,
      currentStreak,
      longestStreak: Math.max(progress.longestStreak, currentStreak),
      lastPracticeDate: today,
    };
  }

  return {
    ...progress,
    currentStreak: 1,
    lastPracticeDate: today,
    longestStreak: Math.max(progress.longestStreak, 1),
  };
}

function recalcOverall(score: CommunicationScore): number {
  const values: number[] = [];
  const keys: CommunicationSubscore[] = ["fluency", "clarity", "precision", "confidence", "impact"];
  keys.forEach((key) => {
    const value = score[key];
    if (typeof value === "number") values.push(value);
  });
  if (values.length === 0) return score.overall;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export function updateProgressAfterExercise(
  userId: string,
  attempt: ExerciseAttempt,
  archetypeOverride?: UserArchetype
): UserProgress {
  let progress = getUserProgress(userId);
  progress = updateStreak(progress, attempt.timestamp);

  const updatedScore = { ...progress.communicationScore };
  attempt.impactedScores.forEach((subscore) => {
    const current = updatedScore[subscore];
    const nextValue =
      typeof current === "number" ? Math.round(current * 0.7 + attempt.score * 0.3) : attempt.score;
    updatedScore[subscore] = Math.max(0, Math.min(100, nextValue));
  });

  updatedScore.overall = recalcOverall(updatedScore);
  updatedScore.lastUpdated = new Date();

  const nextProgress: UserProgress = {
    ...progress,
    communicationScore: updatedScore,
    totalXP: progress.totalXP + attempt.xpEarned,
    totalSessions: progress.totalSessions + 1,
    totalPracticeTime: progress.totalPracticeTime + attempt.duration,
  };

  nextProgress.archetype = archetypeOverride ?? determineArchetype(nextProgress.communicationScore) ?? DEFAULT_ARCHETYPE;

  setProgress(userId, nextProgress);
  saveExerciseAttempt(userId, attempt);

  return nextProgress;
}
