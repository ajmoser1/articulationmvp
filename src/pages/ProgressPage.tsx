import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronRight, Flame, Trophy } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { FuturismBlock } from "@/components/ui/FuturismBlock";
import { Button } from "@/components/ui/button";
import { getExerciseById } from "@/data/exercises";
import { getExerciseHistory, getUserProgress } from "@/utils/storage";
import type { CommunicationSubscore, ExerciseAttempt } from "@/types/exercise";
import { useStreak } from "@/hooks/useStreak";
import { useCountUp } from "@/hooks/useCountUp";

const USER_ID = "default";
const SUBSCORES: Array<{ key: CommunicationSubscore; label: string }> = [
  { key: "fluency", label: "Fluency" },
  { key: "clarity", label: "Clarity" },
  { key: "precision", label: "Precision" },
  { key: "confidence", label: "Confidence" },
  { key: "impact", label: "Impact" },
];
const SUBSCORE_EXERCISE: Record<CommunicationSubscore, string> = {
  fluency: "filler-words",
  clarity: "one-minute-explainer",
  precision: "eliminate-meandering",
  confidence: "assertive-reframing",
  impact: "closing-statement",
};

function fmtDate(date: Date | string): string {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function trendArrow(delta: number): "↗ improving" | "→ stable" | "↘ declining" {
  if (delta > 2) return "↗ improving";
  if (delta < -2) return "↘ declining";
  return "→ stable";
}

function colorForScore(value: number | null): string {
  if (value === null) return "bg-muted/40";
  if (value >= 80) return "bg-emerald-500/80";
  if (value >= 60) return "bg-emerald-400/75";
  return "bg-red-500/80";
}

function heatColor(count: number): string {
  if (count <= 0) return "bg-muted/20";
  if (count === 1) return "bg-primary/25";
  if (count === 2) return "bg-primary/45";
  if (count === 3) return "bg-primary/65";
  return "bg-primary";
}

const ProgressPage = () => {
  const navigate = useNavigate();
  const streak = useStreak();
  const progress = getUserProgress(USER_ID);
  const attempts = useMemo(
    () => getExerciseHistory(USER_ID).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
    []
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [animatedSubscores, setAnimatedSubscores] = useState<Record<string, number>>({});

  const overallSeries = useMemo(
    () =>
      attempts.map((a, i) => ({
        idx: i + 1,
        date: fmtDate(a.timestamp),
        score: a.score,
      })),
    [attempts]
  );

  const fourWeekDelta = useMemo(() => {
    if (overallSeries.length < 2) return 0;
    const latest = overallSeries[overallSeries.length - 1].score;
    const baseline = overallSeries[Math.max(0, overallSeries.length - 5)].score;
    return latest - baseline;
  }, [overallSeries]);

  const subscoreTrends = useMemo(() => {
    const bySubscore: Record<CommunicationSubscore, number[]> = {
      fluency: [],
      clarity: [],
      precision: [],
      confidence: [],
      impact: [],
    };
    attempts.forEach((a) => {
      Object.entries(a.impactedScores).forEach(([k, v]) => {
        bySubscore[k as CommunicationSubscore].push(v);
      });
    });
    return SUBSCORES.map((s) => {
      const arr = bySubscore[s.key];
      const delta = arr.length >= 2 ? arr[arr.length - 1] - arr[arr.length - 2] : 0;
      return {
        ...s,
        current: progress.communicationScore[s.key],
        delta,
      };
    });
  }, [attempts, progress.communicationScore]);

  const heatmapDays = useMemo(() => {
    const today = new Date();
    const firstAttemptDate = attempts.length > 0 ? attempts[0].timestamp : null;
    const sessionsByDay = new Map<string, ExerciseAttempt[]>();
    attempts.forEach((a) => {
      const key = a.timestamp.toISOString().slice(0, 10);
      const existing = sessionsByDay.get(key) ?? [];
      existing.push(a);
      sessionsByDay.set(key, existing);
    });

    if (!firstAttemptDate) return [];

    const elapsedDays =
      Math.floor(
        (Date.parse(today.toISOString().slice(0, 10)) -
          Date.parse(firstAttemptDate.toISOString().slice(0, 10))) /
          86400000
      ) + 1;
    const windowLength = Math.max(1, Math.min(28, elapsedDays));

    return Array.from({ length: windowLength }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (windowLength - 1 - i));
      const key = d.toISOString().slice(0, 10);
      return {
        key,
        date: d,
        count: sessionsByDay.get(key)?.length ?? 0,
      };
    });
  }, [attempts]);

  const selectedDayAttempts = useMemo(() => {
    if (!selectedDay) return [];
    return attempts.filter((a) => a.timestamp.toISOString().slice(0, 10) === selectedDay);
  }, [attempts, selectedDay]);

  const achievements = useMemo(() => {
    const list: string[] = [];
    if (progress.currentStreak >= 5) list.push("🏆 5-Day Streak");
    if (progress.longestStreak >= 10) list.push("🔥 10-Day Fire");
    if (attempts.length >= 1) list.push("🎯 First Session");
    if (attempts.length >= 5) list.push("📈 First Improvement");
    if (progress.totalXP >= 500) list.push("⚡ 500 XP");
    if (progress.communicationScore.overall >= 70) list.push("⭐ Rising Communicator");
    return list.slice(0, 4);
  }, [progress, attempts.length]);

  const byExercise = useMemo(() => {
    const map = new Map<string, ExerciseAttempt[]>();
    attempts.forEach((a) => {
      const arr = map.get(a.exerciseId) ?? [];
      arr.push(a);
      map.set(a.exerciseId, arr);
    });
    return Array.from(map.entries()).map(([exerciseId, arr]) => {
      const scores = arr.map((a) => a.score);
      return {
        exerciseId,
        attempts: arr.length,
        scores,
        best: Math.max(...scores),
      };
    });
  }, [attempts]);

  const startedDate = attempts.length ? attempts[0].timestamp : null;
  const currentDate = attempts.length ? attempts[attempts.length - 1].timestamp : null;
  const stars = Math.max(1, Math.min(5, Math.round(progress.communicationScore.overall / 20)));
  const overallCount = useCountUp(progress.communicationScore.overall, { durationMs: 800 });
  const sessionsCount = useCountUp(progress.totalSessions, { durationMs: 800, delayMs: 100 });
  const practiceMinutesCount = useCountUp(Math.round(progress.totalPracticeTime / 60), { durationMs: 800, delayMs: 200 });

  useEffect(() => {
    const keys = subscoreTrends.map((item) => item.key);
    setAnimatedSubscores(
      keys.reduce((acc, key) => {
        acc[key] = 0;
        return acc;
      }, {} as Record<string, number>)
    );
    const timers = subscoreTrends.map((item, index) =>
      window.setTimeout(() => {
        setAnimatedSubscores((prev) => ({ ...prev, [item.key]: item.current ?? 12 }));
      }, index * 100)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [subscoreTrends]);

  return (
    <div className="min-h-screen bg-gradient-layered px-6 py-8 pb-28 relative page-transition">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <FuturismBlock
          variant="block-2"
          className="top-8 right-[-140px] opacity-42"
          borderColor="#F72585"
          blendMode="normal"
          zIndex={1}
        />
        <FuturismBlock
          variant="block-3"
          className="top-[42%] left-[-150px] opacity-34"
          borderColor="#4CC9F0"
          blendMode="normal"
          zIndex={1}
        />
        <FuturismBlock
          variant="triangle-2"
          className="bottom-[-50px] right-[-160px] opacity-32"
          borderColor="#4ADE80"
          blendMode="normal"
          zIndex={1}
        />
        <FuturismBlock
          variant="stripe-1"
          className="bottom-20 left-[-180px] opacity-38"
          blendMode="normal"
          zIndex={1}
        />
      </div>
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-6 relative z-10">
        {/* Overall power */}
        <GlassCard className="p-6 space-y-4" hover={false}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground font-sans">
                Overall Communication Power
              </p>
              <h1 className="text-5xl font-serif font-bold text-foreground">
                {Math.round(overallCount)}/100
              </h1>
              <p className="text-primary text-lg">
                {"★".repeat(stars)}
                <span className="text-muted-foreground/40">{"★".repeat(5 - stars)}</span>
              </p>
            </div>
            <div className="text-sm text-muted-foreground font-sans">
              {startedDate && currentDate
                ? `Started: ${fmtDate(startedDate)} • Current: ${fmtDate(currentDate)}`
                : "Complete your first session to build trends"}
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overallSeries}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis dataKey="idx" tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#4A6741"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm font-sans text-muted-foreground">
            {fourWeekDelta >= 0 ? "+" : ""}
            {fourWeekDelta} points in the last 4 sessions
          </p>
        </GlassCard>

        {/* Skill breakdown */}
        <GlassCard className="p-6 space-y-4" hover={false}>
          <h2 className="text-xl font-serif text-foreground">Skill Breakdown</h2>
          {subscoreTrends.map((s) => (
            <div key={s.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm font-sans">
                <span className="text-foreground">{s.label}</span>
                <span className="text-muted-foreground">
                  {s.current === null ? "Unknown" : `${s.current}/100 • ${trendArrow(s.delta)}`}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className={`h-full rounded-full ${colorForScore(s.current)}`}
                  style={{ width: `${animatedSubscores[s.key] ?? 0}%`, transition: "width 1000ms ease-out" }}
                />
              </div>
              {s.current === null ? (
                <p className="text-xs text-muted-foreground font-sans">
                  Complete {getExerciseById(SUBSCORE_EXERCISE[s.key])?.name ?? "a recommended exercise"} to unlock
                </p>
              ) : null}
            </div>
          ))}
        </GlassCard>

        {/* Activity stats */}
        <section className="section-block space-y-3">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-sans">
            Activity Snapshot
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="section-accent">
              <p className="text-xs text-muted-foreground font-sans">Total Sessions</p>
              <p className="text-2xl font-serif text-foreground">{Math.round(sessionsCount)}</p>
            </div>
            <div className="section-accent">
              <p className="text-xs text-muted-foreground font-sans">Practice Time</p>
              <p className="text-2xl font-serif text-foreground">{Math.round(practiceMinutesCount)}m</p>
            </div>
            <div className="section-accent">
              <p className="text-xs text-muted-foreground font-sans">Current Streak</p>
              <p
                className={`text-2xl font-serif ${
                  streak.isAtRisk ? "text-primary animate-pulse" : "text-foreground"
                }`}
              >
                <span className="flame-pulse inline-block mr-1">🔥</span>
                <strong>{streak.currentStreak}</strong>
              </p>
            </div>
            <div className="section-accent">
              <p className="text-xs text-muted-foreground font-sans">Longest Streak</p>
              <p className="text-2xl font-serif text-foreground">🔥 {progress.longestStreak}</p>
            </div>
          </div>
          <div className="section-divider" />
        </section>

        {/* Weekly activity heatmap */}
        <section className="section-block space-y-4">
          <div className="section-accent">
            <h2 className="text-xl font-serif text-foreground">Weekly Activity</h2>
          </div>
          <div className="grid grid-cols-14 gap-1">
            {heatmapDays.map((d) => (
              <button
                key={d.key}
                onClick={() => setSelectedDay(d.key)}
                className={`h-5 rounded-sm ${heatColor(d.count)} ${
                  selectedDay === d.key ? "ring-2 ring-primary" : ""
                }`}
                title={`${fmtDate(d.date)}: ${d.count} session(s)`}
              />
            ))}
          </div>
          {selectedDay ? (
            <div className="text-sm font-sans text-muted-foreground">
              <p className="mb-1">Sessions on {fmtDate(selectedDay)}:</p>
              {selectedDayAttempts.length === 0 ? (
                <p>None</p>
              ) : (
                <ul className="space-y-1">
                  {selectedDayAttempts.map((a) => (
                    <li key={a.id} className="text-foreground">
                      {getExerciseById(a.exerciseId)?.name ?? a.exerciseId} • {a.score}/100 • +{a.xpEarned} XP
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
          <div className="section-divider" />
        </section>

        {/* Achievements */}
        <section className="section-block space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif text-foreground">Achievements</h2>
            <Button variant="secondary" className="btn-glass h-9 px-3">
              View All
            </Button>
          </div>
          <div className="meta-row">
            {(achievements.length ? achievements : ["Start practicing to see progress here!"]).map((a) => (
              <div key={a} className="meta-chip text-foreground">
                {a}
              </div>
            ))}
          </div>
          <div className="section-divider" />
        </section>

        {/* Exercise history */}
        <section className="section-block space-y-4">
          <h2 className="text-xl font-serif text-foreground">Exercise History</h2>
          {byExercise.length === 0 ? (
            <p className="text-sm text-muted-foreground font-sans">Start practicing to see progress here!</p>
          ) : (
            <div className="space-y-3">
              {byExercise.map((entry, idx) => (
                <div key={entry.exerciseId} className="space-y-3">
                  <button
                    className="w-full px-1 py-1 text-left"
                    onClick={() => navigate("/exercises")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-sans text-foreground">
                        {getExerciseById(entry.exerciseId)?.name ?? entry.exerciseId} ({entry.attempts} attempts)
                      </p>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground font-sans mt-1">
                      {entry.scores.join(" → ")} (Best: {entry.best})
                    </p>
                  </button>
                  {idx < byExercise.length - 1 && <div className="section-divider" />}
                </div>
              ))}
            </div>
          )}
          <div className="section-divider" />
        </section>

        <Button
          variant="secondary"
          className="btn-glass self-start inline-flex items-center gap-2"
          onClick={() => navigate("/dashboard")}
        >
          <Trophy className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default ProgressPage;
