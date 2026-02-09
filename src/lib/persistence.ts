// LocalStorage-based persistence for user demographics and exercise history.
// Handles environments where localStorage may be unavailable (SSR, private mode).

export interface UserDemographics {
  gender: string;
  ageRange: string;
  country: string;
  currentRole: string;
  hobbies: string;
}

export interface StoredExerciseResult {
  timestamp: string; // ISO string
  topic: string;
  totalFillerWords: number;
  fillersPerMinute: number;
  // Category name → count
  categoryCounts: Record<string, number>;
  // Optional transcript (may be removed when near storage limit)
  transcript?: string;
}

export interface ProgressStats {
  totalExercises: number;
  averageFPM: number;
  /**
   * Basic trend indicator based on first vs last fillersPerMinute:
   * - "improving" when latest < first (fewer fillers)
   * - "declining" when latest > first
   * - "stable" otherwise or when not enough data
   */
  improvementTrend: "improving" | "declining" | "stable";
}

const DEMOGRAPHICS_KEY = "user_demographics";
// Legacy key used before introducing this utility
const LEGACY_DEMOGRAPHICS_KEY = "userDemographics";
const EXERCISE_HISTORY_KEY = "exercise_history";
const SELECTED_TOPIC_KEY = "selectedTopic";

// Rough localStorage limit is ~5MB; keep a safety margin.
const STORAGE_SOFT_LIMIT_BYTES = 4.5 * 1024 * 1024;

function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
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
    // Swallow quota / privacy errors; caller should tolerate missing persistence.
  }
}

function safeRemoveItem(key: string): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

// ---------------- Demographics ----------------

export function saveDemographics(demographics: UserDemographics): void {
  const payload = JSON.stringify(demographics);
  safeSetItem(DEMOGRAPHICS_KEY, payload);
}

export function getDemographics(): UserDemographics | null {
  let raw = safeGetItem(DEMOGRAPHICS_KEY);
  // Fallback to legacy key if new key not present
  if (!raw) {
    raw = safeGetItem(LEGACY_DEMOGRAPHICS_KEY);
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as UserDemographics;
    if (typeof parsed === "object" && parsed !== null) {
      const record = parsed as Partial<UserDemographics>;
      if (
        typeof record.gender === "string" &&
        typeof record.ageRange === "string" &&
        typeof record.country === "string"
      ) {
        return {
          gender: record.gender,
          ageRange: record.ageRange,
          country: record.country,
          currentRole: typeof record.currentRole === "string" ? record.currentRole : "",
          hobbies: typeof record.hobbies === "string" ? record.hobbies : "",
        };
      }
    }
  } catch {
    // Corrupted data; clear it
    safeRemoveItem(DEMOGRAPHICS_KEY);
  }
  return null;
}

// ---------------- Exercise history ----------------

function getRawExerciseHistory(): StoredExerciseResult[] {
  const raw = safeGetItem(EXERCISE_HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredExerciseResult[] | unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => {
      if (typeof item !== "object" || item === null) return false;
      const r = item as StoredExerciseResult;
      return (
        typeof r.timestamp === "string" &&
        typeof r.topic === "string" &&
        typeof r.totalFillerWords === "number" &&
        typeof r.fillersPerMinute === "number" &&
        typeof r.categoryCounts === "object" &&
        r.categoryCounts !== null
      );
    });
  } catch {
    // Corrupted data; clear it
    safeRemoveItem(EXERCISE_HISTORY_KEY);
    return [];
  }
}

function setExerciseHistory(history: StoredExerciseResult[]): void {
  safeSetItem(EXERCISE_HISTORY_KEY, JSON.stringify(history));
}

/**
 * Save a new exercise result, trimming older transcripts / entries if we are
 * close to the storage limit.
 */
export function saveExerciseResult(result: StoredExerciseResult): void {
  const history = getRawExerciseHistory();
  history.push(result);

  // Enforce approximate storage limit by first removing transcripts on oldest
  // entries, then removing entire oldest entries if still too large.
  let json = JSON.stringify(history);
  if (json.length > STORAGE_SOFT_LIMIT_BYTES) {
    // First pass: drop transcripts from oldest to newest until under limit
    for (let i = 0; i < history.length && json.length > STORAGE_SOFT_LIMIT_BYTES; i++) {
      if (history[i].transcript) {
        delete history[i].transcript;
        json = JSON.stringify(history);
      }
    }
    // Second pass: if still too large, remove entire oldest entries
    while (history.length > 0 && json.length > STORAGE_SOFT_LIMIT_BYTES) {
      history.shift();
      json = JSON.stringify(history);
    }
  }

  setExerciseHistory(history);
}

export function getExerciseHistory(): StoredExerciseResult[] {
  return getRawExerciseHistory();
}

export function clearExerciseHistory(): void {
  safeRemoveItem(EXERCISE_HISTORY_KEY);
}

export function clearLocalData(): void {
  safeRemoveItem(EXERCISE_HISTORY_KEY);
  safeRemoveItem(DEMOGRAPHICS_KEY);
  safeRemoveItem(LEGACY_DEMOGRAPHICS_KEY);
  safeRemoveItem(SELECTED_TOPIC_KEY);
}

export function getProgressStats(): ProgressStats {
  const history = getRawExerciseHistory();
  const totalExercises = history.length;
  if (totalExercises === 0) {
    return { totalExercises: 0, averageFPM: 0, improvementTrend: "stable" };
  }

  const sumFPM = history.reduce((sum, r) => sum + r.fillersPerMinute, 0);
  const averageFPM = sumFPM / totalExercises;

  let improvementTrend: ProgressStats["improvementTrend"] = "stable";
  if (totalExercises >= 2) {
    const first = history[0].fillersPerMinute;
    const last = history[history.length - 1].fillersPerMinute;
    const diff = first - last; // positive when improving
    const threshold = 0.5; // small noise threshold
    if (diff > threshold) improvementTrend = "improving";
    else if (diff < -threshold) improvementTrend = "declining";
  }

  return { totalExercises, averageFPM, improvementTrend };
}

