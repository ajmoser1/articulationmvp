/**
 * Filler word detection and analysis system.
 * Categorizes fillers, counts them, and analyzes distribution across the transcript.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Category names for filler word groups */
export type FillerCategory =
  | "hesitation"
  | "discourse"
  | "temporal"
  | "thinking";

/** Location of a single filler occurrence (character index in transcript) */
export interface FillerPosition {
  word: string;
  position: number;
}

/** Count of fillers in each third of the transcript */
export interface DistributionAnalysis {
  beginning: number;
  middle: number;
  end: number;
}

/** Full result of analyzeFillerWords() */
export interface FillerAnalysisResult {
  totalFillerWords: number;
  fillersPerMinute: number;
  categoryCounts: Record<FillerCategory, number>;
  specificFillerCounts: Record<string, number>;
  fillerPositions: FillerPosition[];
  distributionAnalysis: DistributionAnalysis;
  detectionAccuracy: number;
  detectionSummary: string;
  patterns: FillerPatternAnalysis;
}

/** Internal: a match with position and length for overlap handling */
interface MatchWithLength {
  word: string;
  category: FillerCategory;
  position: number;
  length: number;
}

interface WordToken {
  word: string;
  start: number;
  end: number;
}

export interface FillerPatternAnalysis {
  positionPatterns: {
    startOfSpeech: number;
    midSpeech: number;
    endOfSpeech: number;
  };
  contextPatterns: {
    whenExplaining: number;
    whenListing: number;
    whenTransitioning: number;
    whenAnswering: number;
    midSentence: number;
  };
  insights: string[];
}

// ---------------------------------------------------------------------------
// Filler word categories (canonical lowercase for matching)
// ---------------------------------------------------------------------------

export const FILLER_CATEGORIES: Record<FillerCategory, readonly string[]> = {
  hesitation: ["um", "uh", "er", "ah", "hmm"],
  discourse: [
    "like",
    "you know",
    "i mean",
    "sort of",
    "kind of",
    "basically",
    "actually",
    "literally",
  ],
  temporal: ["so", "well", "now", "then", "okay", "alright"],
  thinking: ["let me think", "let me see", "how do i say"],
} as const;

/** All category keys for iterating */
const CATEGORY_KEYS: FillerCategory[] = [
  "hesitation",
  "discourse",
  "temporal",
  "thinking",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Escape special regex characters in a string (e.g. "kind of" has no special, "how do I say" has no special in JS regex) */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a regex that matches the filler with word boundaries.
 * - Single word: \bword\b (allows optional punctuation adjacent)
 * - Multi-word: \bword1\s+word2\s+...\b
 * Uses 'gi' when compiled for case-insensitive, global matching.
 */
function patternForFiller(filler: string): RegExp {
  if (filler.includes(" ")) {
    const parts = filler.split(/\s+/).map((p) => escapeRegex(p));
    const withBoundaries = parts.join("\\s+");
    return new RegExp(`\\b${withBoundaries}\\b`, "gi");
  }
  const escaped = escapeRegex(filler);
  return new RegExp(`\\b${escaped}\\b`, "gi");
}

/**
 * Find all non-overlapping filler matches, with multi-word phrases preferred
 * over single-word matches that would overlap. Returns matches sorted by position.
 */
function findAllFillerMatches(transcript: string): MatchWithLength[] {
  const normalized = transcript;
  const matches: MatchWithLength[] = [];

  // Collect matches: multi-word first (thinking, then discourse phrases), then single words.
  // Order matters so we match "let me think" before "let", "me", "think".
  const order: { filler: string; category: FillerCategory }[] = [];
  for (const cat of CATEGORY_KEYS) {
    const list = FILLER_CATEGORIES[cat];
    for (const f of list) {
      order.push({ filler: f, category: cat });
    }
  }
  // Sort so longer phrases come first (so "let me think" before "like")
  order.sort((a, b) => b.filler.length - a.filler.length);

  for (const { filler, category } of order) {
    const re = patternForFiller(filler);
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(normalized)) !== null) {
      const position = m.index;
      const length = m[0].length;
      matches.push({ word: m[0], category, position, length });
    }
  }

  // Sort by position, then by length descending (prefer longer match at same start)
  matches.sort((a, b) => a.position - b.position || b.length - a.length);

  // Remove overlaps: keep each match only if it doesn't start before the end of the previous kept match
  const nonOverlapping: MatchWithLength[] = [];
  let lastEnd = -1;
  for (const match of matches) {
    if (match.position >= lastEnd) {
      nonOverlapping.push(match);
      lastEnd = match.position + match.length;
    }
  }

  return nonOverlapping;
}

function tokenizeWords(transcript: string): WordToken[] {
  const tokens: WordToken[] = [];
  const re = /[A-Za-z']+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(transcript)) !== null) {
    tokens.push({ word: m[0], start: m.index, end: m.index + m[0].length });
  }
  return tokens;
}

function findTokenIndex(tokens: WordToken[], position: number): number {
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].start <= position && position < tokens[i].end) return i;
  }
  return -1;
}

function getWordContext(tokens: WordToken[], tokenIndex: number) {
  const before = tokens.slice(Math.max(0, tokenIndex - 3), tokenIndex).map((t) => t.word.toLowerCase());
  const after = tokens.slice(tokenIndex + 1, tokenIndex + 4).map((t) => t.word.toLowerCase());
  return { before, after };
}

function isPrecededBy(tokens: WordToken[], tokenIndex: number, words: string[]): boolean {
  const { before } = getWordContext(tokens, tokenIndex);
  return before.some((w) => words.includes(w));
}

function isFollowedBy(tokens: WordToken[], tokenIndex: number, words: string[]): boolean {
  const { after } = getWordContext(tokens, tokenIndex);
  return after.some((w) => words.includes(w));
}

function isPartOfPhrase(transcript: string, position: number, phrases: string[]): boolean {
  const windowStart = Math.max(0, position - 20);
  const windowEnd = Math.min(transcript.length, position + 40);
  const slice = transcript.slice(windowStart, windowEnd).toLowerCase();
  return phrases.some((p) => slice.includes(p));
}

function isSentenceStart(transcript: string, position: number): boolean {
  for (let i = position - 1; i >= 0; i--) {
    const ch = transcript[i];
    if (/[A-Za-z]/.test(ch)) return false;
    if (/[.!?]/.test(ch)) return true;
  }
  return true;
}

function hasNearbyPausePunctuation(transcript: string, position: number, length: number): boolean {
  const before = transcript.slice(Math.max(0, position - 2), position);
  const after = transcript.slice(position + length, position + length + 2);
  return /[,;—-]/.test(before) || /[,;—-]/.test(after);
}

function normalizeMatch(match: string): string {
  return match.toLowerCase().replace(/[^\w\s']/g, "").replace(/\s+/g, " ").trim();
}

function shouldFlagFiller(
  transcript: string,
  match: MatchWithLength,
  tokens: WordToken[]
): boolean {
  const normalized = normalizeMatch(match.word);
  const tokenIndex = findTokenIndex(tokens, match.position);
  const { before, after } = tokenIndex >= 0 ? getWordContext(tokens, tokenIndex) : { before: [], after: [] };

  if (normalized === "you know") return true;

  if (normalized === "like") {
    const beLike = ["was", "is", "were", "are", "am", "be", "been", "being", "looks", "look", "looked", "sounds", "sound", "sounded", "feels", "feel", "felt"];
    const determiners = ["this", "that", "these", "those", "my", "your", "his", "her", "its", "our", "their", "a", "an", "the", "some", "any", "each", "every", "no", "another", "either", "neither", "both", "few", "many", "much", "several"];
    const pronouns = ["him", "her", "them", "me", "us", "you", "i", "he", "she", "we", "they", "it", "someone", "somebody", "something", "anyone", "anybody", "anything"];
    const skipPhrases = ["would like", "i'd like", "id like", "i would like"];
    if (isPrecededBy(tokens, tokenIndex, beLike)) return false;
    if (isFollowedBy(tokens, tokenIndex, [...determiners, ...pronouns])) return false;
    if (isPartOfPhrase(transcript, match.position, skipPhrases)) return false;
    return true;
  }

  if (normalized === "so") {
    const intensifiers = ["good", "bad", "happy", "sad", "great", "small", "big", "tired", "excited", "important", "funny", "hard", "easy", "simple", "beautiful"];
    if (isFollowedBy(tokens, tokenIndex, ["that"])) return false;
    if (isSentenceStart(transcript, match.position) && /,/.test(transcript.slice(match.position + match.length, match.position + match.length + 2))) {
      return false;
    }
    if (isFollowedBy(tokens, tokenIndex, intensifiers)) return false;
    return true;
  }

  if (normalized === "well") {
    if (isPartOfPhrase(transcript, match.position, ["as well", "might as well"])) return false;
    return true;
  }

  if (normalized === "actually" || normalized === "basically") {
    const correctionCues = ["not", "no", "just", "rather", "specifically", "in", "because"];
    if (isFollowedBy(tokens, tokenIndex, correctionCues)) return false;
    return true;
  }

  if (normalized === "i mean") {
    const clarificationCues = ["that", "because", "if", "when", "what", "where", "why", "how", "to", "for", "by"];
    if (isFollowedBy(tokens, tokenIndex, clarificationCues)) return false;
    return true;
  }

  return true;
}

function analyzeFillerPatterns(
  transcript: string,
  fillerPositions: Array<{ word: string; position: number }>
): FillerPatternAnalysis {
  const tokens = tokenizeWords(transcript);
  const total = Math.max(1, fillerPositions.length);
  const len = transcript.length;
  const startCutoff = len * 0.2;
  const endCutoff = len * 0.8;

  const positionPatterns = {
    startOfSpeech: 0,
    midSpeech: 0,
    endOfSpeech: 0,
  };

  const contextPatterns = {
    whenExplaining: 0,
    whenListing: 0,
    whenTransitioning: 0,
    whenAnswering: 0,
    midSentence: 0,
  };

  const explainCues = ["because", "since", "essentially", "basically", "the", "reason", "in", "other", "words"];
  const listingCues = ["first", "second", "third", "also", "and", "or"];
  const transitionCues = ["so", "now", "then", "moving", "on", "anyway", "but", "however"];

  const questionMarkPositions: number[] = [];
  for (let i = 0; i < transcript.length; i++) {
    if (transcript[i] === "?") questionMarkPositions.push(i);
  }

  const isNearCue = (tokenIndex: number, cues: string[]) => {
    const { before, after } = getWordContext(tokens, tokenIndex);
    const windowWords = [...before, tokens[tokenIndex]?.word?.toLowerCase(), ...after].filter(Boolean);
    return windowWords.some((w) => cues.includes(w));
  };

  const isNearExplanationPhrase = (tokenIndex: number) => {
    const { before, after } = getWordContext(tokens, tokenIndex);
    const windowWords = [...before, tokens[tokenIndex]?.word?.toLowerCase(), ...after].filter(Boolean);
    const joined = windowWords.join(" ");
    return (
      windowWords.includes("because") ||
      windowWords.includes("since") ||
      windowWords.includes("essentially") ||
      windowWords.includes("basically") ||
      joined.includes("the reason") ||
      joined.includes("in other words")
    );
  };

  const isNearListing = (tokenIndex: number) => {
    if (isNearCue(tokenIndex, listingCues)) return true;
    const token = tokens[tokenIndex];
    if (!token) return false;
    const window = transcript.slice(Math.max(0, token.start - 40), token.end + 40);
    const commaCount = (window.match(/,/g) ?? []).length;
    const andCount = (window.match(/\band\b/gi) ?? []).length;
    return commaCount >= 2 || andCount >= 2;
  };

  const isNearTransition = (tokenIndex: number) => {
    const { before, after } = getWordContext(tokens, tokenIndex);
    const joined = [...before, tokens[tokenIndex]?.word?.toLowerCase(), ...after]
      .filter(Boolean)
      .join(" ");
    return (
      isNearCue(tokenIndex, transitionCues) ||
      joined.includes("moving on") ||
      joined.includes("anyway")
    );
  };

  const isNearAnswering = (position: number) => {
    if (position <= 0) return false;
    if (position <= transcript.length * 0.15) return true;
    return questionMarkPositions.some((q) => position - q >= 0 && position - q < 40);
  };

  const isMidSentence = (position: number, length: number) => {
    const before = transcript.slice(Math.max(0, position - 40), position);
    const after = transcript.slice(position + length, position + length + 40);
    const nearBoundaryBefore = /[.!?]/.test(before);
    const nearBoundaryAfter = /[.!?]/.test(after);
    return !(nearBoundaryBefore || nearBoundaryAfter);
  };

  for (const filler of fillerPositions) {
    if (filler.position < startCutoff) positionPatterns.startOfSpeech++;
    else if (filler.position >= endCutoff) positionPatterns.endOfSpeech++;
    else positionPatterns.midSpeech++;

    const tokenIndex = findTokenIndex(tokens, filler.position);
    if (tokenIndex >= 0) {
      if (isNearExplanationPhrase(tokenIndex)) contextPatterns.whenExplaining++;
      if (isNearListing(tokenIndex)) contextPatterns.whenListing++;
      if (isNearTransition(tokenIndex)) contextPatterns.whenTransitioning++;
    }

    if (isNearAnswering(filler.position)) contextPatterns.whenAnswering++;
    if (isMidSentence(filler.position, filler.word.length)) contextPatterns.midSentence++;
  }

  const insights: string[] = [];
  const startPct = (positionPatterns.startOfSpeech / total) * 100;
  if (startPct > 40) {
    insights.push(
      "Most fillers appeared when starting to speak—try taking a breath before beginning."
    );
  }

  const contextEntries: Array<[keyof FillerPatternAnalysis["contextPatterns"], number]> = Object.entries(
    contextPatterns
  ) as Array<[keyof FillerPatternAnalysis["contextPatterns"], number]>;
  contextEntries.sort((a, b) => b[1] - a[1]);
  const topContext = contextEntries[0]?.[0];

  if (topContext === "whenExplaining") {
    insights.push(
      "You used more fillers when explaining concepts—practice explaining complex ideas beforehand."
    );
  } else if (topContext === "whenListing") {
    insights.push(
      "Fillers increased when listing multiple items—try organizing lists mentally first."
    );
  } else if (topContext === "whenTransitioning") {
    insights.push(
      "Fillers appeared when changing topics—plan your transitions ahead of time."
    );
  }

  const midSentencePct = (contextPatterns.midSentence / total) * 100;
  if (midSentencePct > 40) {
    insights.push(
      "Many fillers mid-sentence suggest thinking while speaking—slow down slightly."
    );
  }

  return { positionPatterns, contextPatterns, insights };
}

/**
 * Compute distribution: count fillers in first third, middle third, and last third of transcript (by character position).
 */
function computeDistribution(
  transcriptLength: number,
  positions: number[]
): DistributionAnalysis {
  if (transcriptLength <= 0) {
    return { beginning: 0, middle: 0, end: 0 };
  }
  const third = transcriptLength / 3;
  let beginning = 0;
  let middle = 0;
  let end = 0;
  for (const pos of positions) {
    if (pos < third) beginning++;
    else if (pos < 2 * third) middle++;
    else end++;
  }
  return { beginning, middle, end };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyzes a transcript for filler words: counts by category and by specific filler,
 * records positions, and analyzes distribution across beginning/middle/end thirds.
 *
 * - Case-insensitive.
 * - Uses word boundaries (e.g. "like" is not matched in "likely").
 * - Handles punctuation (word boundary treats punctuation as non-word).
 * - Multi-word fillers (e.g. "let me think") are detected as full phrases; overlapping
 *   single-word matches are not double-counted.
 *
 * @param transcript - Full transcript text
 * @param durationMinutes - Duration in minutes (used for fillersPerMinute; use 1 if unknown)
 * @returns FillerAnalysisResult with counts, positions, and distribution
 */
export function analyzeFillerWords(
  transcript: string,
  durationMinutes: number
): FillerAnalysisResult {
  const matches = findAllFillerMatches(transcript);
  const tokens = tokenizeWords(transcript);

  const flaggedMatches = matches.filter((m) => shouldFlagFiller(transcript, m, tokens));
  const skippedCount = matches.length - flaggedMatches.length;
  const totalFillerWords = flaggedMatches.length;
  const fillersPerMinute =
    durationMinutes > 0 ? totalFillerWords / durationMinutes : 0;

  const categoryCounts: Record<FillerCategory, number> = {
    hesitation: 0,
    discourse: 0,
    temporal: 0,
    thinking: 0,
  };
  const specificFillerCounts: Record<string, number> = {};
  const fillerPositions: FillerPosition[] = [];
  const positionsForDistribution: number[] = [];

  for (const m of flaggedMatches) {
    categoryCounts[m.category]++;
    const key = m.word.toLowerCase();
    specificFillerCounts[key] = (specificFillerCounts[key] ?? 0) + 1;
    fillerPositions.push({ word: m.word, position: m.position });
    positionsForDistribution.push(m.position);
  }

  const distributionAnalysis = computeDistribution(
    transcript.length,
    positionsForDistribution
  );

  const detectionAccuracy =
    matches.length === 0 ? 100 : Math.round((flaggedMatches.length / matches.length) * 100);
  const detectionSummary = `Analyzed ${matches.length} potential fillers, flagged ${flaggedMatches.length} as actual fillers (${detectionAccuracy}% detection confidence)`;

  return {
    totalFillerWords,
    fillersPerMinute,
    categoryCounts,
    specificFillerCounts,
    fillerPositions,
    distributionAnalysis,
    detectionAccuracy,
    detectionSummary,
    patterns: analyzeFillerPatterns(transcript, fillerPositions),
  };
}
