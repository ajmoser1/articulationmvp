import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  analyzeFillerWords,
  type FillerAnalysisResult,
  type FillerCategory,
} from "@/lib/fillerWords";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { FuturismBlock } from "@/components/ui/FuturismBlock";
import { FillerCategoryCard } from "@/components/FillerCategoryCard";
import { saveExerciseResult } from "@/lib/persistence";
import { FILLER_CATEGORIES } from "@/lib/fillerWords";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const TYPEWRITER_MS_PER_CHAR = 40;

type ResultsLocationState = {
  transcript?: string;
  analysisResults?: FillerAnalysisResult;
  durationMinutes?: number;
} | null;

function buildSegments(
  transcript: string,
  visibleLength: number,
  fillerPositions: { word: string; position: number }[]
): { type: "normal" | "filler"; text: string; start: number }[] {
  if (visibleLength <= 0) return [];
  const ranges = fillerPositions
    .map((f) => ({ start: f.position, end: f.position + f.word.length }))
    .filter((r) => r.end > 0 && r.start < visibleLength)
    .sort((a, b) => a.start - b.start);

  const segments: { type: "normal" | "filler"; text: string; start: number }[] = [];
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
        type: "filler",
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
  const [glowPositions, setGlowPositions] = useState<Set<number>>(new Set());

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
    let timeoutId: number | undefined;
    const tick = () => {
      index += 1;
      if (index > len) {
        setTypewriterDone(true);
        return;
      }
      setVisibleLength(index);
      if (fillerStarts.has(index - 1)) {
        setFlashKey((k) => k + 1);
        setGlowPositions((prev) => {
          const next = new Set(prev);
          next.add(index - 1);
          return next;
        });
        window.setTimeout(() => {
          setGlowPositions((prev) => {
            const next = new Set(prev);
            next.delete(index - 1);
            return next;
          });
        }, 400);
      }
      const speedBoost = Math.min(8, Math.floor((index / len) * 8));
      const jitter = Math.floor(Math.random() * 9) - 4; // -4..4
      const base = TYPEWRITER_MS_PER_CHAR - speedBoost;
      const nextDelay = Math.max(30, Math.min(45, base + jitter));
      timeoutId = window.setTimeout(tick, nextDelay);
    };
    timeoutId = window.setTimeout(tick, TYPEWRITER_MS_PER_CHAR);
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [transcript, fillerStarts]);

  useEffect(() => {
    if (typeof transcript !== "string" || transcript.trim() === "") {
      navigate("/onboarding/practice", { replace: true });
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

  const categoryCards = useMemo(() => {
    if (!analysisResults) return [];
    const total = Math.max(1, analysisResults.totalFillerWords);
    const categories = (Object.keys(analysisResults.categoryCounts) as FillerCategory[])
      .map((category) => {
        const count = analysisResults.categoryCounts[category];
        const specificFillers = (FILLER_CATEGORIES[category] ?? [])
          .map((word) => ({
            word,
            count: analysisResults.specificFillerCounts[word] ?? 0,
          }))
          .filter((f) => f.count > 0)
          .sort((a, b) => b.count - a.count);

        const usageInsight =
          analysisResults.distributionAnalysis.beginning >=
          Math.max(
            analysisResults.distributionAnalysis.middle,
            analysisResults.distributionAnalysis.end
          )
            ? "You used these most often near the beginning."
            : analysisResults.distributionAnalysis.middle >=
              analysisResults.distributionAnalysis.end
            ? "You used these most often in the middle."
            : "You used these most often toward the end.";

        const descriptions: Record<FillerCategory, string> = {
          hesitation: "Hesitation fillers indicate uncertainty or thinking pauses.",
          discourse: "Discourse markers help bridge ideas but can become habitual.",
          temporal: "Temporal fillers often appear when transitioning between ideas.",
          thinking: "Thinking indicators signal you are searching for the right words.",
        };

        const whyUsed: Record<FillerCategory, string> = {
          hesitation: "Often used while searching for the right word or organizing thoughts.",
          discourse: "Used to keep the conversation flowing while you plan the next phrase.",
          temporal: "Used to buy time before introducing a new idea or conclusion.",
          thinking: "Used when you need a moment to structure the next point.",
        };

        const colors: Record<FillerCategory, string> = {
          hesitation: "#7209B7",
          discourse: "#F72585",
          temporal: "#4CC9F0",
          thinking: "#4ADE80",
        };

        return {
          category,
          count,
          percentage: (count / total) * 100,
          specificFillers,
          description: descriptions[category],
          whyUsed: whyUsed[category],
          usageInsight,
          color: colors[category],
        };
      })
      .sort((a, b) => b.count - a.count);

    return categories.map((item, index) => ({
      ...item,
      tier: index === 0 ? "large" : index === 1 ? "medium" : "small",
    }));
  }, [analysisResults]);

  if (typeof transcript !== "string" || transcript.trim() === "" || !analysisResults) {
    return null;
  }

  const { totalFillerWords, fillersPerMinute, categoryCounts, distributionAnalysis } =
    analysisResults;

  const totalCount = useCountUp(totalFillerWords, 800);
  const fpmCount = useCountUp(fillersPerMinute, 800);

  const heroReveal = useScrollReveal({ threshold: 0.1 });
  const categoryReveal = useScrollReveal({ threshold: 0.2 });
  const chartReveal = useScrollReveal({ threshold: 0.4 });
  const insightsReveal = useScrollReveal({ threshold: 0.55 });

  const distributionData = [
    {
      label: "Beginning",
      value: analysisResults.distributionAnalysis.beginning,
      color: "#4CC9F0",
    },
    {
      label: "Middle",
      value: analysisResults.distributionAnalysis.middle,
      color: "#F72585",
    },
    {
      label: "End",
      value: analysisResults.distributionAnalysis.end,
      color: "#4ADE80",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-layered flex flex-col pb-24 relative">
      {/* Flash overlay */}
      {flashKey > 0 && <div key={flashKey} className="results-flash-overlay" />}

      <FuturismBlock
        variant="block-1"
        className="top-6 right-[-140px] futurism-intense"
        borderColor="#F72585"
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

      <div className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full flex flex-col gap-20 md:gap-28 relative z-10">
        {/* Section 1 - Hero metrics + transcript */}
        <section
          ref={heroReveal.ref}
          className={`grid gap-8 md:grid-cols-[1.1fr_0.9fr] ${heroReveal.isVisible ? "section-reveal is-visible" : "section-reveal"}`}
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground font-sans">
                Filler summary
              </p>
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground leading-tight">
                {Math.round(totalCount)}
                <span className="block text-xl md:text-2xl text-muted-foreground font-sans mt-2">
                  Total fillers detected
                </span>
              </h1>
            </div>
            <div className="flex items-baseline gap-4">
              <p className="text-4xl md:text-5xl font-serif font-bold text-foreground tabular-nums">
                {fpmCount.toFixed(1)}
              </p>
              <span className="text-sm uppercase tracking-[0.2em] text-muted-foreground font-sans">
                Fillers per minute
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-sm uppercase tracking-wide text-muted-foreground font-sans">
              Your transcript
            </p>
            <div
              className={`font-serif text-foreground leading-relaxed whitespace-pre-wrap min-h-[8rem] transition-opacity duration-300 ${
                typewriterDone ? "opacity-90" : "opacity-100"
              }`}
            >
              {segments.map((seg, i) =>
                seg.type === "filler" ? (
                  <span
                    key={i}
                    className={`rounded px-0.5 bg-destructive/15 text-destructive results-filler-glow ${
                      glowPositions.has(seg.start) ? "results-filler-glow-animate" : ""
                    }`}
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
          </div>
        </section>

        {/* Category cards */}
        <section
          ref={categoryReveal.ref}
          className={`flex flex-col gap-4 ${categoryReveal.isVisible ? "section-reveal is-visible" : "section-reveal"}`}
        >
          {categoryCards.map((card, index) => (
            <div
              key={card.category}
              className={`stagger-item ${categoryReveal.isVisible ? "is-visible" : ""}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <FillerCategoryCard
                categoryName={
                  card.category === "hesitation"
                    ? "Hesitation Fillers"
                    : card.category === "discourse"
                    ? "Discourse Markers"
                    : card.category === "temporal"
                    ? "Temporal Fillers"
                    : "Thinking Indicators"
                }
                count={card.count}
                percentage={card.percentage}
                tier={card.tier}
                specificFillers={card.specificFillers}
                description={card.description}
                whyUsed={card.whyUsed}
                usageInsight={card.usageInsight}
                color={card.color}
              />
            </div>
          ))}
        </section>

        {/* Section 3 - Visual pattern chart */}
        <section
          ref={chartReveal.ref}
          className={`glass-card p-6 md:p-8 ${chartReveal.isVisible ? "section-reveal is-visible" : "section-reveal"}`}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif font-semibold text-foreground">
              Filler distribution
            </h2>
            <span className="text-sm text-muted-foreground font-sans">
              Beginning • Middle • End
            </span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: "rgba(74, 103, 65, 0.08)" }}
                  contentStyle={{
                    background: "rgba(255,255,255,0.9)",
                    border: "1px solid rgba(74,103,65,0.2)",
                    borderRadius: "12px",
                  }}
                />
                <Bar dataKey="value" radius={[10, 10, 10, 10]}>
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Section 4 - Contextual insights */}
        <section
          ref={insightsReveal.ref}
          className={`flex flex-col gap-3 ${insightsReveal.isVisible ? "section-reveal is-visible" : "section-reveal"}`}
        >
          {analysisResults.patterns.insights.map((insight, index) => (
            <div
              key={insight}
              className={`insight-card ${insightsReveal.isVisible ? "is-visible" : ""}`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <p className="text-sm text-foreground font-sans">{insight}</p>
            </div>
          ))}
        </section>

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
        <section className="flex flex-wrap gap-4 pt-4 sticky bottom-6 bg-gradient-to-t from-background/90 to-transparent backdrop-blur-sm pb-4">
          <Button
            onClick={() => navigate("/onboarding/topics")}
            className="btn-warm font-sans"
          >
            Try Another Topic
          </Button>
          <Button
            variant="secondary"
            className="btn-glass font-sans"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.localStorage.setItem("onboarding_complete", "true");
              }
              navigate("/communication-profile");
            }}
          >
            View Progress
          </Button>
        </section>
      </div>
    </div>
  );
};

export default Results;
