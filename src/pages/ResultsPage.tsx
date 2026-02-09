import { useMemo } from "react";
import {
  getExerciseHistory,
  getProgressStats,
  type StoredExerciseResult,
} from "@/lib/persistence";
import { GlassCard } from "@/components/ui/glass-card";
import { FuturismBlock } from "@/components/ui/FuturismBlock";
import { Sparkles } from "lucide-react";

const ProgressPage = () => {
  const history = useMemo<StoredExerciseResult[]>(() => getExerciseHistory(), []);
  const stats = useMemo(() => getProgressStats(), []);

  const sorted = useMemo(
    () =>
      [...history].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [history]
  );

  const bestFPM =
    sorted.length > 0
      ? sorted.reduce(
          (min, r) => (r.fillersPerMinute < min ? r.fillersPerMinute : min),
          sorted[0].fillersPerMinute
        )
      : 0;

  const trendMessage =
    stats.improvementTrend === "improving"
      ? "You're improving! Keep practicing."
      : stats.improvementTrend === "declining"
      ? "Keep at it. Consistency is key."
      : "You're maintaining steady performance.";

  return (
    <div className="min-h-screen bg-gradient-layered px-6 py-10 pb-24 flex flex-col items-center relative page-transition">
      <FuturismBlock
        variant="block-4"
        className="top-10 left-[-120px]"
        borderColor="#4CC9F0"
        zIndex={1}
      />
      <FuturismBlock
        variant="block-2"
        className="bottom-[-60px] right-[-140px]"
        borderColor="#F72585"
        zIndex={2}
      />
      <FuturismBlock
        variant="triangle-1"
        className="top-16 right-[-80px]"
        borderColor="#4ADE80"
        zIndex={1}
      />
      <FuturismBlock
        variant="stripe-3"
        className="top-28 right-[-140px]"
        zIndex={1}
      />
      <div className="w-full max-w-3xl space-y-8 relative z-10">
        <header>
          <h1 className="text-2xl font-serif font-semibold text-foreground mb-2">
            Your progress
          </h1>
          <p className="text-sm text-muted-foreground font-sans">
            Track how your filler word usage changes over time.
          </p>
        </header>

        {/* Summary stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlassCard className="p-5" hover={false}>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-sans mb-1">
              Exercises completed
            </p>
            <p className="text-3xl font-serif font-semibold text-foreground">
              {stats.totalExercises}
            </p>
          </GlassCard>
          <GlassCard className="p-5" hover={false}>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-sans mb-1">
              Avg fillers / min
            </p>
            <p className="text-3xl font-serif font-semibold text-foreground">
              {stats.averageFPM.toFixed(1)}
            </p>
          </GlassCard>
          <GlassCard className="p-5" hover={false}>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-sans mb-1">
              Best (lowest) FPM
            </p>
            <p className="text-3xl font-serif font-semibold text-foreground">
              {bestFPM.toFixed(1)}
            </p>
          </GlassCard>
        </section>

        {/* Trend indicator */}
        <GlassCard className="p-5" hover={false}>
          <p className="text-sm font-serif text-foreground">{trendMessage}</p>
        </GlassCard>

        {/* Exercise history */}
        <section className="space-y-4">
          <h2 className="text-lg font-serif font-semibold text-foreground">
            Exercise history
          </h2>
          {sorted.length === 0 ? (
            <GlassCard className="p-6 text-center status-success" hover={false}>
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full glass-subtle flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-success" />
                </div>
                <p className="text-foreground font-serif">
                  Your progress story starts here.
                </p>
                <p className="text-sm text-muted-foreground font-sans">
                  Complete your first practice and your results will show up with trends and insights.
                </p>
              </div>
            </GlassCard>
          ) : (
            <ul className="space-y-3">
              {sorted.map((entry, index) => {
                const current = entry.fillersPerMinute;
                const previous = sorted[index + 1]?.fillersPerMinute;
                let indicator: string | null = null;
                if (typeof previous === "number") {
                  if (current < previous) {
                    indicator = "Improved from last time";
                  } else if (current > previous) {
                    indicator = "Higher than last time";
                  } else {
                    indicator = "Same as last time";
                  }
                }

                return (
                  <GlassCard
                    key={entry.timestamp + entry.topic}
                    className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    hover={false}
                  >
                    <div>
                      <p className="font-serif text-foreground">
                        {entry.topic || "Practice"}
                      </p>
                      <p className="text-xs text-muted-foreground font-sans">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-sans text-foreground">
                        {entry.fillersPerMinute.toFixed(1)} FPM
                      </p>
                      {indicator && (
                        <p className="text-xs text-muted-foreground font-sans mt-0.5">
                          {indicator}
                        </p>
                      )}
                    </div>
                  </GlassCard>
                );
              })}
            </ul>
          )}
        </section>

        {/* Local storage note */}
        <section>
          <p className="text-xs text-muted-foreground font-sans">
            Your data is stored locally. Clearing browser data will erase your progress.
          </p>
        </section>
      </div>
    </div>
  );
};

export default ProgressPage;

