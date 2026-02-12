import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { StructuralAnalysisResult, StructuralElementPosition } from "@/lib/structuralAnalysis";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { FuturismBlock } from "@/components/ui/FuturismBlock";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const TYPEWRITER_MS_PER_CHAR = 40;

type ImpromptuResultsState = {
  transcript?: string;
  analysisResults?: StructuralAnalysisResult;
  durationMinutes?: number;
  question?: string;
} | null;

function buildSegments(
  transcript: string,
  visibleLength: number,
  elements: StructuralElementPosition[]
): { type: "normal" | "position" | "supporting"; text: string; start: number }[] {
  if (visibleLength <= 0) return [];
  const ranges = elements
    .map((e) => ({ start: e.position, end: e.position + e.phrase.length, category: e.category }))
    .filter((r) => r.end > 0 && r.start < visibleLength)
    .sort((a, b) => a.start - b.start);

  const segments: { type: "normal" | "position" | "supporting"; text: string; start: number }[] = [];
  let pos = 0;
  for (const r of ranges) {
    const clipStart = Math.max(r.start, 0);
    const clipEnd = Math.min(r.end, visibleLength);
    if (pos < clipStart) {
      segments.push({
        type: "normal",
        text: transcript.slice(pos, clipStart),
        start: pos,
      });
    }
    if (clipStart < clipEnd) {
      segments.push({
        type: r.category,
        text: transcript.slice(clipStart, clipEnd),
        start: clipStart,
      });
    }
    pos = clipEnd;
  }
  if (pos < visibleLength) {
    segments.push({
      type: "normal",
      text: transcript.slice(pos, visibleLength),
      start: pos,
    });
  }
  return segments;
}

function useCountUp(target: number, durationMs: number) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, durationMs]);

  return value;
}

const ImpromptuResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ImpromptuResultsState;
  const transcript = state?.transcript;
  const analysisResults = state?.analysisResults;
  const question = state?.question ?? "Impromptu question";

  const [visibleLength, setVisibleLength] = useState(0);
  const [typewriterDone, setTypewriterDone] = useState(false);

  useEffect(() => {
    if (typeof transcript !== "string" || transcript.length === 0) return;
    setVisibleLength(0);
    setTypewriterDone(false);
    let index = 0;
    const len = transcript.length;
    let timeoutId: number | undefined;
    const tick = () => {
      index += 1;
      if (index > len) {
        setTypewriterDone(true);
        return;
      }
      setVisibleLength(index);
      const base = TYPEWRITER_MS_PER_CHAR;
      const jitter = Math.floor(Math.random() * 9) - 4;
      const nextDelay = Math.max(30, Math.min(50, base + jitter));
      timeoutId = window.setTimeout(tick, nextDelay);
    };
    timeoutId = window.setTimeout(tick, TYPEWRITER_MS_PER_CHAR);
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [transcript]);

  useEffect(() => {
    if (typeof transcript !== "string" || transcript.trim() === "") {
      navigate("/impromptu", { replace: true });
    }
  }, [transcript, navigate]);

  const segments = useMemo(() => {
    if (typeof transcript !== "string" || !analysisResults) return [];
    return buildSegments(
      transcript,
      visibleLength,
      analysisResults.allElements
    );
  }, [transcript, visibleLength, analysisResults]);

  const positionCount = useCountUp(analysisResults?.positionCount ?? 0, 800);
  const supportingCount = useCountUp(analysisResults?.supportingCount ?? 0, 800);
  const elementsPerMin = useCountUp(analysisResults?.elementsPerMinute ?? 0, 800);

  const heroReveal = useScrollReveal({ threshold: 0.1 });
  const metricsReveal = useScrollReveal({ threshold: 0.2 });
  const insightReveal = useScrollReveal({ threshold: 0.35 });

  if (typeof transcript !== "string" || transcript.trim() === "" || !analysisResults) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-layered flex flex-col pb-24 relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <FuturismBlock
          variant="block-1"
          className="top-6 right-[-140px] futurism-intense"
          borderColor="#7209B7"
          zIndex={1}
        />
        <FuturismBlock
          variant="block-3"
          className="top-20 left-[-140px] futurism-intense"
          borderColor="#4CC9F0"
          zIndex={2}
        />
        <FuturismBlock
          variant="triangle-2"
          className="bottom-[-60px] left-[-100px] futurism-intense"
          borderColor="#4ADE80"
          zIndex={2}
        />
        <FuturismBlock
          variant="stripe-1"
          className="top-24 right-[-140px]"
          zIndex={1}
        />
        <FuturismBlock
          variant="stripe-2"
          className="top-44 left-[-140px]"
          zIndex={1}
        />
      </div>
      <div className="content-backdrop" />

      <div className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full flex flex-col gap-12 md:gap-16 relative z-10">
        {/* Hero - metrics */}
        <section
          ref={heroReveal.ref}
          className={`grid gap-6 md:grid-cols-3 ${heroReveal.isVisible ? "section-reveal is-visible" : "section-reveal"}`}
        >
          <div className="flex flex-col gap-1">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground font-sans">
              Position statements
            </p>
            <p className="text-4xl md:text-5xl font-serif font-bold text-foreground tabular-nums">
              {Math.round(positionCount)}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground font-sans">
              Supporting phrases
            </p>
            <p className="text-4xl md:text-5xl font-serif font-bold text-foreground tabular-nums">
              {Math.round(supportingCount)}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground font-sans">
              Per minute
            </p>
            <p className="text-4xl md:text-5xl font-serif font-bold text-primary tabular-nums">
              {elementsPerMin.toFixed(1)}
            </p>
          </div>
        </section>

        {/* Question */}
        <GlassCard className="p-6" hover={false}>
          <p className="text-sm text-muted-foreground font-sans mb-2">Question</p>
          <p className="font-serif text-foreground leading-relaxed">{question}</p>
        </GlassCard>

        {/* Transcript with highlights */}
        <section
          ref={metricsReveal.ref}
          className={`flex flex-col gap-3 ${metricsReveal.isVisible ? "section-reveal is-visible" : "section-reveal"}`}
        >
          <p className="text-sm uppercase tracking-wide text-muted-foreground font-sans">
            Your transcript
          </p>
          <div
            className={`font-serif text-foreground leading-relaxed whitespace-pre-wrap min-h-[8rem] transition-opacity duration-300 ${
              typewriterDone ? "opacity-90" : "opacity-100"
            }`}
          >
            {segments.map((seg, i) =>
              seg.type === "position" ? (
                <span
                  key={i}
                  className="rounded px-0.5 bg-primary/15 text-primary font-medium"
                >
                  {seg.text}
                </span>
              ) : seg.type === "supporting" ? (
                <span
                  key={i}
                  className="rounded px-0.5 bg-accent/20 text-accent font-medium"
                >
                  {seg.text}
                </span>
              ) : (
                <span key={i}>{seg.text}</span>
              )
            )}
            {!typewriterDone && (
              <span className="inline-block w-2 h-4 bg-foreground/60 typewriter-caret ml-0.5 align-baseline" />
            )}
          </div>
        </section>

        {/* Insight */}
        <section
          ref={insightReveal.ref}
          className={`${insightReveal.isVisible ? "section-reveal is-visible" : "section-reveal"}`}
        >
          <GlassCard className="p-6" hover={false}>
            <p className="text-sm text-muted-foreground font-sans mb-2">Insight</p>
            <p className="font-serif text-foreground leading-relaxed italic">
              {analysisResults.insight}
            </p>
          </GlassCard>
        </section>

        {/* Legend */}
        <GlassCard className="p-6" hover={false}>
          <p className="text-sm text-muted-foreground font-sans mb-3">Legend</p>
          <div className="flex flex-wrap gap-4">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-4 h-4 rounded bg-primary/20 border border-primary/40" />
              <span className="font-sans text-sm">Position statement (e.g. "I believe", "in my opinion")</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-4 h-4 rounded bg-accent/20 border border-accent/40" />
              <span className="font-sans text-sm">Supporting phrase (e.g. "because", "however", "for instance")</span>
            </span>
          </div>
        </GlassCard>

        {/* Buttons */}
        <section className="flex flex-wrap gap-4 pt-4 pb-4">
          <Button
            onClick={() => navigate("/impromptu")}
            className="btn-warm font-sans"
          >
            Try Another Question
          </Button>
          <Button
            variant="secondary"
            className="btn-glass font-sans"
            onClick={() => navigate("/exercises")}
          >
            Back to Exercises
          </Button>
        </section>
      </div>
    </div>
  );
};

export default ImpromptuResults;
