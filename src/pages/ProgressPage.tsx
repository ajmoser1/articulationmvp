import { GlassCard } from "@/components/ui/glass-card";

const ProgressPage = () => {
  return (
    <div className="min-h-screen bg-gradient-layered px-6 py-8 pb-28 flex flex-col relative page-transition">
      <div className="max-w-md mx-auto w-full flex flex-col gap-6 relative z-10">
        <header>
          <h1 className="text-3xl font-serif font-bold text-foreground">Progress</h1>
          <p className="text-muted-foreground font-sans">
            Track streaks, XP, and score trends.
          </p>
        </header>
        <GlassCard className="p-6" hover={false}>
          <p className="text-foreground font-sans">
            Progress dashboard coming next.
          </p>
        </GlassCard>
      </div>
    </div>
  );
};

export default ProgressPage;
