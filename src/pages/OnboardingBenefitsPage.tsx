import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  CheckCircle2,
  Clock3,
  Crown,
  Ear,
  GraduationCap,
  Lightbulb,
  Rocket,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { FuturismBlock } from "@/components/ui/FuturismBlock";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const statCards = [
  "74% of executives rank communication above technical depth for leadership readiness.",
  "Strong communicators earn ~20% more over time in role growth studies.",
  "Communication is the #1 skill employers screen for in hiring loops.",
  "90% of successful leaders cite communication as their core force multiplier.",
];

const OnboardingBenefitsPage = () => {
  const navigate = useNavigate();
  const s1 = useScrollReveal({ threshold: 0.2 });
  const s2 = useScrollReveal({ threshold: 0.2 });
  const s3 = useScrollReveal({ threshold: 0.2 });
  const s4 = useScrollReveal({ threshold: 0.2 });
  const s5 = useScrollReveal({ threshold: 0.2 });
  const s6 = useScrollReveal({ threshold: 0.2 });
  const s7 = useScrollReveal({ threshold: 0.2 });

  const goProfile = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("benefits_seen", "true");
    }
    navigate("/communication-profile");
  };

  return (
    <div className="min-h-screen bg-gradient-layered px-6 py-10 pb-28 relative page-transition">
      <FuturismBlock
        variant="block-3"
        className="top-6 right-[-140px] futurism-strong"
        borderColor="#4CC9F0"
        zIndex={1}
      />
      <FuturismBlock
        variant="triangle-1"
        className="bottom-[-80px] left-[-120px]"
        borderColor="#F72585"
        zIndex={1}
      />

      <div className="max-w-4xl mx-auto w-full flex flex-col gap-12 relative z-10">
        <section
          ref={s1.ref}
          className={`section-reveal ${s1.isVisible ? "is-visible" : ""}`}
        >
          <GlassCard className="p-8 md:p-10 space-y-5" hover={false}>
            <div className="w-14 h-14 rounded-2xl glass-subtle flex items-center justify-center">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif text-foreground font-bold">
              You&apos;re Not Alone
            </h1>
            <p className="text-lg text-muted-foreground font-serif max-w-3xl">
              Most people use 20-30 filler words per conversation. They rarely
              notice until someone shows them. You just found out. That is the
              first step most people never take.
            </p>
          </GlassCard>
        </section>

        <section
          ref={s2.ref}
          className={`section-reveal ${s2.isVisible ? "is-visible" : ""}`}
        >
          <div className="grid md:grid-cols-2 gap-4">
            <GlassCard className="p-6 space-y-4 border border-red-500/20 bg-red-500/10" hover={false}>
              <h2 className="text-2xl font-serif text-foreground">When fillers run the show</h2>
              <ul className="space-y-3 text-sm font-sans">
                <li className="text-foreground inline-flex items-start gap-2"><Ear className="w-4 h-4 mt-0.5 text-red-500" />Attention drops <strong>-40%</strong></li>
                <li className="text-foreground inline-flex items-start gap-2"><BarChart3 className="w-4 h-4 mt-0.5 text-red-500" />Credibility feels weaker <strong>-34%</strong></li>
                <li className="text-foreground inline-flex items-start gap-2"><Lightbulb className="w-4 h-4 mt-0.5 text-red-500" />Idea retention falls <strong>-50%</strong></li>
                <li className="text-foreground inline-flex items-start gap-2"><Briefcase className="w-4 h-4 mt-0.5 text-red-500" />Opportunities can slip by</li>
              </ul>
            </GlassCard>
            <GlassCard className="p-6 space-y-4 border border-emerald-500/20 bg-emerald-500/10" hover={false}>
              <h2 className="text-2xl font-serif text-foreground">When you speak clearly</h2>
              <ul className="space-y-3 text-sm font-sans">
                <li className="text-foreground inline-flex items-start gap-2"><Ear className="w-4 h-4 mt-0.5 text-emerald-600" />People stay with you</li>
                <li className="text-foreground inline-flex items-start gap-2"><TrendingUp className="w-4 h-4 mt-0.5 text-emerald-600" />Trust and confidence <strong>+60%</strong></li>
                <li className="text-foreground inline-flex items-start gap-2"><Lightbulb className="w-4 h-4 mt-0.5 text-emerald-600" />Ideas stick after you finish</li>
                <li className="text-foreground inline-flex items-start gap-2"><Rocket className="w-4 h-4 mt-0.5 text-emerald-600" />More doors open, faster</li>
              </ul>
            </GlassCard>
          </div>
        </section>

        <section
          ref={s3.ref}
          className={`section-reveal ${s3.isVisible ? "is-visible" : ""}`}
        >
          <div className="section-block space-y-6">
            <h2 className="text-4xl font-serif text-foreground font-bold">
              It&apos;s 100% Fixable
            </h2>
            <div className="grid sm:grid-cols-2 gap-3 text-sm font-sans">
              <p className="section-accent inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" />Not a permanent trait, just a habit loop.</p>
              <p className="section-accent inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" />Average improvement: around 40% in 2 weeks.</p>
              <p className="section-accent inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" />Most users feel changes after 3-5 sessions.</p>
              <p className="section-accent inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" />You already have the words. We train access speed.</p>
            </div>
            <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4">
              <p className="text-sm font-sans text-foreground">
                <strong>Example:</strong> Sarah started at 52 fillers, dropped to 18 in two weeks,
                then 7 after a month. Same ideas, clearer delivery. She got promoted.
              </p>
              <div className="mt-3 h-2 rounded-full bg-muted/30 overflow-hidden">
                <div className="h-full bg-primary rounded-full w-[20%]" />
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-sans">52 → 18 → 7 (4 weeks)</p>
            </div>
            <div className="section-divider" />
          </div>
        </section>

        <section
          ref={s4.ref}
          className={`section-reveal ${s4.isVisible ? "is-visible" : ""}`}
        >
          <div className="section-block space-y-5">
            <h2 className="text-3xl font-serif text-foreground">What you&apos;ll gain</h2>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="section-accent">
                <p className="font-serif text-foreground text-lg mb-2">Career</p>
                <ul className="text-sm font-sans text-foreground space-y-1">
                  <li>🎯 Nail interviews</li>
                  <li>📊 Lead meetings clearly</li>
                  <li>🚀 Get promoted faster</li>
                </ul>
              </div>
              <div className="section-accent">
                <p className="font-serif text-foreground text-lg mb-2">Personal</p>
                <ul className="text-sm font-sans text-foreground space-y-1">
                  <li>💬 Express ideas cleanly</li>
                  <li>🧠 Less mental friction</li>
                  <li>✨ Be understood quickly</li>
                </ul>
              </div>
              <div className="section-accent">
                <p className="font-serif text-foreground text-lg mb-2">Social</p>
                <ul className="text-sm font-sans text-foreground space-y-1">
                  <li>👥 Hold attention in groups</li>
                  <li>🎤 Speak up with confidence</li>
                  <li>💪 Sound calm, not rushed</li>
                </ul>
              </div>
            </div>
            <div className="section-divider" />
          </div>
        </section>

        <section
          ref={s5.ref}
          className={`section-reveal ${s5.isVisible ? "is-visible" : ""}`}
        >
          <div className="section-block space-y-4">
            <h2 className="text-3xl font-serif text-foreground">The Communication Advantage</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {statCards.map((stat) => (
                <div key={stat} className="rounded-xl border border-white/25 bg-white/12 p-4 text-sm font-sans text-foreground">
                  {stat}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground font-sans">
              Sources: executive communication surveys, compensation reports, and hiring trend analyses.
            </p>
            <div className="section-divider" />
          </div>
        </section>

        <section
          ref={s6.ref}
          className={`section-reveal ${s6.isVisible ? "is-visible" : ""}`}
        >
          <div className="section-block space-y-5">
            <h2 className="text-3xl font-serif text-foreground">Your path to clear communication</h2>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="section-accent">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Step 1</p>
                <p className="font-serif text-foreground text-xl">Measure</p>
                <p className="text-sm font-sans text-muted-foreground">We map how you speak today. No guessing.</p>
              </div>
              <div className="section-accent">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Step 2</p>
                <p className="font-serif text-foreground text-xl">Practice</p>
                <p className="text-sm font-sans text-muted-foreground">Targeted drills in 5-10 minute sessions.</p>
              </div>
              <div className="section-accent">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Step 3</p>
                <p className="font-serif text-foreground text-xl">Transform</p>
                <p className="text-sm font-sans text-muted-foreground">Watch the data shift and confidence rise.</p>
              </div>
            </div>
            <div className="section-divider" />
          </div>
        </section>

        <section
          ref={s7.ref}
          className={`section-reveal ${s7.isVisible ? "is-visible" : ""}`}
        >
          <div className="rounded-3xl p-8 md:p-10 bg-gradient-to-br from-primary/20 via-background to-primary/10 border border-primary/20">
            <div className="max-w-2xl space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans inline-flex items-center gap-2">
                <Crown className="w-4 h-4 text-primary" />
                The Invitation
              </p>
              <h2 className="text-4xl md:text-5xl font-serif text-foreground font-bold">
                Ready to unlock your communication potential?
              </h2>
              <p className="text-lg text-muted-foreground font-serif">
                Let&apos;s open your full profile and build a personalized improvement plan.
              </p>
              <Button className="btn-warm text-lg px-8 py-6" onClick={goProfile}>
                Show Me My Profile
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <p className="text-sm text-muted-foreground font-sans inline-flex items-center gap-2 ml-6">
                <Clock3 className="w-4 h-4" />
                Takes 30 seconds. See exactly where you stand.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default OnboardingBenefitsPage;
