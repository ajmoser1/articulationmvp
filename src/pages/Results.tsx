import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  analyzeFillerWords,
  type FillerAnalysisResult,
  type FillerCategory,
} from "@/lib/fillerWords";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { saveExerciseResult } from "@/lib/persistence";

const TYPEWRITER_MS_PER_CHAR = 60;

type ResultsLocationState = {
  transcript?: string;
  analysisResults?: FillerAnalysisResult;
  durationMinutes?: number;
} | null;

function buildSegments(
  transcript: string,
  visibleLength: number,
  fillerPositions: { word: string; position: number }[]
): { type: "normal" | "filler"; text: string }[] {
  if (visibleLength <= 0) return [];
  const ranges = fillerPositions
    .map((f) => ({ start: f.position, end: f.position + f.word.length }))
    .filter((r) => r.end > 0 && r.start < visibleLength)
    .sort((a, b) => a.start - b.start);

  const segments: { type: "normal" | "filler"; text: string }[] = [];
  let pos = 0;
  for (const r of ranges) {
    const clipStart = Math.max(r.start, 0);
    const clipEnd = Math.min(r.end, visibleLength);
    if (pos < clipStart) {
      segments.push({
        type: "normal",
        text: transcript.slice(pos, clipStart),
      });
    }
    if (clipStart < clipEnd) {
      segments.push({
        type: "filler",
        text: transcript.slice(clipStart, clipEnd),
      });
    }
    pos = clipEnd;
  }
  if (pos < visibleLength) {
    segments.push({ type: "normal", text: transcript.slice(pos, visibleLength) });
  }
  return segments;
}

function getFillerStartPositions(
  fillerPositions: { word: string; position: number }[]
): Set<number> {
  return new Set(fillerPositions.map((f) => f.position));
}

const CATEGORY_LABELS: Record<FillerCategory, string> = {
  hesitation: "Hesitation",
  discourse: "Discourse",
  temporal: "Temporal",
  thinking: "Thinking",
};

function getDistributionInsight(
  dist: { beginning: number; middle: number; end: number }
): string {
  const { beginning, middle, end } = dist;
  const total = beginning + middle + end;
  if (total === 0) return "No fillers detected.";
  const max = Math.max(beginning, middle, end);
  if (beginning === middle && middle === end) {
    return "Fillers are spread evenly through your speech.";
  }
  if (max === beginning) {
    return "You use more fillers at the beginning—consider pausing to gather your thoughts before starting.";
  }
  if (max === middle) {
    return "Most fillers appear in the middle—practicing mid-speech pauses could help.";
  }
  return "You use more fillers toward the end—try wrapping up with a clear conclusion.";
}

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResultsLocationState;
  const transcript = state?.transcript;
  const passedAnalysis = state?.analysisResults;
  const durationMinutes = state?.durationMinutes ?? 1;

  const analysisResults = useMemo(() => {
    if (typeof transcript !== "string" || transcript.trim() === "") return null;
    if (passedAnalysis) return passedAnalysis;
    return analyzeFillerWords(transcript, durationMinutes);
  }, [transcript, durationMinutes, passedAnalysis]);

  const [visibleLength, setVisibleLength] = useState(0);
  const [flashKey, setFlashKey] = useState(0);
  const [typewriterDone, setTypewriterDone] = useState(false);

  const fillerStarts = useMemo(
    () =>
      analysisResults ? getFillerStartPositions(analysisResults.fillerPositions) : new Set<number>(),
    [analysisResults]
  );

  useEffect(() => {
    if (typeof transcript !== "string" || transcript.length === 0) return;
    setVisibleLength(0);
    setTypewriterDone(false);
    let index = 0;
    const len = transcript.length;
    const interval = setInterval(() => {
      index += 1;
      if (index > len) {
        clearInterval(interval);
        setTypewriterDone(true);
        return;
      }
      setVisibleLength(index);
      if (fillerStarts.has(index - 1)) {
        setFlashKey((k) => k + 1);
      }
    }, TYPEWRITER_MS_PER_CHAR);
    return () => clearInterval(interval);
  }, [transcript, fillerStarts]);

  useEffect(() => {
    if (typeof transcript !== "string" || transcript.trim() === "") {
      navigate("/practice", { replace: true });
    }
  }, [transcript, navigate]);

  useEffect(() => {
    if (!analysisResults || typeof transcript !== "string" || transcript.trim() === "") {
      return;
    }

    const topic =
      (typeof window !== "undefined" &&
        window.localStorage &&
        window.localStorage.getItem("selectedTopic")) ||
      "Practice topic";

    saveExerciseResult({
      timestamp: new Date().toISOString(),
      topic,
      totalFillerWords: analysisResults.totalFillerWords,
      fillersPerMinute: analysisResults.fillersPerMinute,
      categoryCounts: analysisResults.categoryCounts,
      transcript,
    });
  }, [analysisResults, transcript]);

  const segments = useMemo(() => {
    if (typeof transcript !== "string" || !analysisResults) return [];
    return buildSegments(
      transcript,
      visibleLength,
      analysisResults.fillerPositions
    );
  }, [transcript, visibleLength, analysisResults]);

  const distributionInsight = useMemo(() => {
    if (!analysisResults) return "";
    return getDistributionInsight(analysisResults.distributionAnalysis);
  }, [analysisResults]);

  const topFiveFillers = useMemo(() => {
    if (!analysisResults?.specificFillerCounts) return [];
    return Object.entries(analysisResults.specificFillerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [analysisResults]);

  if (typeof transcript !== "string" || transcript.trim() === "" || !analysisResults) {
    return null;
  }

  const { totalFillerWords, fillersPerMinute, categoryCounts, distributionAnalysis } =
    analysisResults;

  return (
    <div className="min-h-screen bg-gradient-layered flex flex-col pb-24">
      {/* Flash overlay */}
      {flashKey > 0 && <div key={flashKey} className="results-flash-overlay" />}

      <div className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full flex flex-col gap-8">
        {/* Top metrics */}
        <section className="flex flex-wrap gap-4">
          <GlassCard className="flex-1 min-w-[140px] p-6" hover={false}>
            <p className="text-sm uppercase tracking-wide text-muted-foreground font-sans mb-1">
              Total filler words
            </p>
            <p className="text-4xl font-serif font-bold text-foreground tabular-nums">
              {totalFillerWords}
            </p>
          </GlassCard>
          <GlassCard className="flex-1 min-w-[140px] p-6" hover={false}>
            <p className="text-sm uppercase tracking-wide text-muted-foreground font-sans mb-1">
              Fillers per minute
            </p>
            <p className="text-4xl font-serif font-bold text-foreground tabular-nums">
              {fillersPerMinute.toFixed(1)}
            </p>
          </GlassCard>
        </section>

        {/* Transcript with typewriter and filler highlight */}
        <GlassCard className="p-6" hover={false}>
          <p className="text-sm uppercase tracking-wide text-muted-foreground font-sans mb-3">
            Your transcript
          </p>
          <div className="font-serif text-foreground leading-relaxed whitespace-pre-wrap min-h-[8rem]">
            {segments.map((seg, i) =>
              seg.type === "filler" ? (
                <span
                  key={i}
                  className="rounded px-0.5 bg-destructive/15 text-destructive"
                >
                  {seg.text}
                </span>
              ) : (
                <span key={i}>{seg.text}</span>
              )
            )}
            {!typewriterDone && (
              <span className="inline-block w-2 h-4 bg-foreground/60 animate-pulse-gentle ml-0.5 align-baseline" />
            )}
          </div>
        </GlassCard>

        {/* Detailed metrics */}
        <GlassCard className="p-6 space-y-6" hover={false}>
          <h2 className="text-lg font-serif font-semibold text-foreground">
            Breakdown
          </h2>

          <div>
            <p className="text-sm text-muted-foreground font-sans mb-2">
              By category
            </p>
            <ul className="flex flex-wrap gap-x-6 gap-y-1 text-foreground font-sans">
              {(Object.keys(categoryCounts) as FillerCategory[]).map((cat) => (
                <li key={cat}>
                  {CATEGORY_LABELS[cat]}: {categoryCounts[cat]}
                </li>
              ))}
            </ul>
          </div>

          {topFiveFillers.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground font-sans mb-2">
                Top fillers
              </p>
              <ul className="text-foreground font-sans space-y-1">
                {topFiveFillers.map(([word, count]) => (
                  <li key={word}>
                    &ldquo;{word}&rdquo; — {count}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground font-sans mb-2">
              Distribution
            </p>
            <p className="text-foreground font-sans">
              Beginning: {distributionAnalysis.beginning}, Middle:{" "}
              {distributionAnalysis.middle}, End: {distributionAnalysis.end}
            </p>
            <p className="mt-2 text-muted-foreground font-serif text-sm italic">
              {distributionInsight}
            </p>
          </div>
        </GlassCard>

        {/* Buttons */}
        <section className="flex flex-wrap gap-4 pt-4">
          <Button
            onClick={() => navigate("/topics")}
            className="btn-warm font-sans"
          >
            Try Another Topic
          </Button>
          <Button
            variant="secondary"
            className="btn-glass font-sans"
            onClick={() => navigate("/progress")}
          >
            View Progress
          </Button>
        </section>
      </div>
    </div>
  );
};

export default Results;
