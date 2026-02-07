import { useMemo } from "react";
import {
  getExerciseHistory,
  getProgressStats,
  type StoredExerciseResult,
} from "@/lib/persistence";
import { GlassCard } from "@/components/ui/glass-card";
import { WatercolorBlob } from "@/components/ui/WatercolorBlob";

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
      <WatercolorBlob position="top-left" colorScheme="rainbow" size={550} />
      <WatercolorBlob position="bottom-right" colorScheme="blue-cyan" size={500} />
      <WatercolorBlob position="center" colorScheme="green-purple" size={400} />
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
            <p className="text-sm text-muted-foreground font-sans">
              You haven&apos;t completed any exercises yet. Once you finish a practice,
              your results will appear here.
            </p>
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

