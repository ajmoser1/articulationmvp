import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Clock3,
  Download,
  Eraser,
  LogOut,
  Mail,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  UserRound,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { FuturismBlock } from "@/components/ui/FuturismBlock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ACHIEVEMENTS } from "@/data/achievements";
import {
  clearExerciseHistory as clearLegacyExerciseHistory,
  clearLocalData,
  getDemographics,
  saveDemographics,
  type UserDemographics,
} from "@/lib/persistence";
import { clearUserProgressData, getExerciseHistory, getUserProgress } from "@/utils/storage";

const USER_ID = "default";
const PROFILE_KEY = "profile_settings";
const DISPLAY_NAME_KEY = "profile_display_name";
const EMAIL_KEY = "profile_email";
const DEFAULT_EMAIL = "Not connected yet";

interface ProfileSettings {
  notificationsEnabled: boolean;
  streakReminders: boolean;
  practiceMinutes: number;
}

function loadSettings(): ProfileSettings {
  if (typeof window === "undefined") {
    return { notificationsEnabled: true, streakReminders: true, practiceMinutes: 5 };
  }
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return { notificationsEnabled: true, streakReminders: true, practiceMinutes: 5 };
    const parsed = JSON.parse(raw) as Partial<ProfileSettings>;
    return {
      notificationsEnabled: parsed.notificationsEnabled ?? true,
      streakReminders: parsed.streakReminders ?? true,
      practiceMinutes: parsed.practiceMinutes ?? 5,
    };
  } catch {
    return { notificationsEnabled: true, streakReminders: true, practiceMinutes: 5 };
  }
}

function saveSettings(settings: ProfileSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(settings));
}

function getDisplayName() {
  if (typeof window === "undefined") return "Speaker";
  return window.localStorage.getItem(DISPLAY_NAME_KEY) || "Speaker";
}

function saveDisplayName(name: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DISPLAY_NAME_KEY, name.trim() || "Speaker");
}

function getEmailDraft() {
  if (typeof window === "undefined") return DEFAULT_EMAIL;
  return window.localStorage.getItem(EMAIL_KEY) || DEFAULT_EMAIL;
}

function saveEmailDraft(email: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(EMAIL_KEY, email.trim());
}

const ARCHETYPE_ICON: Record<string, string> = {
  "rapid-thinker": "⚡",
  wanderer: "🧭",
  hedger: "🪞",
  "generic-speaker": "🧩",
  "polished-pro": "✨",
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<ProfileSettings>(loadSettings);
  const [displayName, setDisplayName] = useState(getDisplayName);
  const [email, setEmail] = useState(getEmailDraft);
  const [demographics, setDemographics] = useState<UserDemographics | null>(null);

  const progress = getUserProgress(USER_ID);
  const attempts = getExerciseHistory(USER_ID).sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  useEffect(() => {
    setDemographics(getDemographics());
  }, []);

  const joinDate = attempts[0]?.timestamp ?? new Date();
  const totalDays = Math.max(
    1,
    Math.floor((Date.now() - joinDate.getTime()) / (24 * 60 * 60 * 1000)) + 1
  );

  const topAchievements = useMemo(() => {
    const earned = new Set(progress.achievements);
    return ACHIEVEMENTS.filter((achievement) => earned.has(achievement.id)).slice(0, 3);
  }, [progress.achievements]);

  const archetype = progress.archetype;
  const archetypeIcon = ARCHETYPE_ICON[archetype.id] ?? "🧠";

  const updateSettings = (next: Partial<ProfileSettings>) => {
    const merged = { ...settings, ...next };
    setSettings(merged);
    saveSettings(merged);
    toast({ title: "Preferences saved", description: "Your settings were updated." });
  };

  const saveProfileFields = () => {
    saveDisplayName(displayName);
    saveEmailDraft(email);
    toast({ title: "Profile saved", description: "Your profile info was updated." });
  };

  const saveDemographicsUpdate = () => {
    if (!demographics) return;
    saveDemographics(demographics);
    toast({ title: "Demographics saved", description: "Topic generation will use your latest profile." });
  };

  const handleExportData = () => {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        profile: { displayName, email, settings },
        demographics,
        progress,
        attempts,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `articulation-data-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export ready", description: "Your data download has started." });
    } catch {
      toast({
        title: "Export failed",
        description: "Could not export data right now. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClearHistory = () => {
    const confirmed = window.confirm(
      "Clear all exercise history and communication stats? This cannot be undone."
    );
    if (!confirmed) return;
    clearLegacyExerciseHistory();
    clearUserProgressData(USER_ID);
    toast({
      title: "History cleared",
      description: "Exercise history and communication stats were reset.",
    });
    window.setTimeout(() => window.location.reload(), 350);
  };

  const handleRetakeDiagnostic = () => {
    const confirmed = window.confirm(
      "Retake diagnostic? This will reset current communication scores and first-run profile."
    );
    if (!confirmed) return;
    clearUserProgressData(USER_ID);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("profile_seen");
      window.localStorage.removeItem("benefits_seen");
      window.localStorage.setItem("onboarding_complete", "false");
    }
    toast({ title: "Diagnostic reset", description: "Run your first exercise again to recalculate archetype." });
    navigate("/onboarding/topics");
  };

  const handleDeleteAccount = () => {
    const confirmPhrase = window.prompt(
      "Type DELETE to permanently clear all local app data."
    );
    if (confirmPhrase !== "DELETE") return;
    clearLocalData();
    clearUserProgressData(USER_ID);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(PROFILE_KEY);
      window.localStorage.removeItem(DISPLAY_NAME_KEY);
      window.localStorage.removeItem(EMAIL_KEY);
      window.localStorage.removeItem("profile_seen");
      window.localStorage.removeItem("benefits_seen");
      window.localStorage.removeItem("onboarding_complete");
    }
    toast({ title: "Data deleted", description: "All local profile data was removed." });
    navigate("/onboarding", { replace: true });
  };

  const version = import.meta.env.VITE_APP_VERSION || "0.1.0-beta";

  return (
    <div className="min-h-screen bg-gradient-layered px-6 py-8 pb-28 flex flex-col relative page-transition">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <FuturismBlock
          variant="block-4"
          className="top-8 right-[-145px] opacity-40"
          borderColor="#4ADE80"
          blendMode="normal"
          zIndex={1}
        />
        <FuturismBlock
          variant="block-2"
          className="top-28 left-[-145px] opacity-34"
          borderColor="#4CC9F0"
          blendMode="normal"
          zIndex={2}
        />
        <FuturismBlock
          variant="triangle-2"
          className="top-[54%] right-[-180px] opacity-30"
          borderColor="#7209B7"
          blendMode="normal"
          zIndex={1}
        />
        <FuturismBlock
          variant="stripe-2"
          className="bottom-16 left-[-170px] opacity-36"
          blendMode="normal"
          zIndex={1}
        />
      </div>
      <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 relative z-10">
        <header>
          <h1 className="text-3xl font-serif font-bold text-foreground">Profile & Settings</h1>
          <p className="text-muted-foreground font-sans">
            Customize your experience and control your data.
          </p>
        </header>

        <GlassCard className="p-6 space-y-4" hover={false}>
          <h2 className="text-xl font-serif text-foreground">User Info</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-sans">Display name</p>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input-glass h-11" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-sans">Join date</p>
              <p className="text-foreground font-sans">{joinDate.toLocaleDateString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-sans">Total days using app</p>
              <p className="text-foreground font-sans">{totalDays} days</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-sans">Overall stats</p>
              <p className="text-foreground font-sans">
                {progress.totalSessions} sessions • {progress.totalXP} XP • 🔥 {progress.currentStreak}
              </p>
            </div>
          </div>
          <Button className="btn-glass" onClick={saveProfileFields}>Save Profile Info</Button>
        </GlassCard>

        <GlassCard className="p-6 space-y-4" hover={false}>
          <h2 className="text-xl font-serif text-foreground">Communication Profile</h2>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground font-sans">Current archetype</p>
              <p className="text-lg font-serif text-foreground">{archetypeIcon} {archetype.name}</p>
            </div>
            <div className="flex gap-2">
              <Button className="btn-glass" onClick={() => navigate("/communication-profile")}>
                View Full Profile
              </Button>
              <Button variant="secondary" className="btn-glass" onClick={handleRetakeDiagnostic}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Retake
              </Button>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 space-y-5" hover={false}>
          <h2 className="text-xl font-serif text-foreground">Settings</h2>

          <div className="space-y-3">
            <p className="text-sm uppercase tracking-wide text-muted-foreground font-sans">Preferences</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-sans">Dark mode</p>
                
              </div>
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground font-sans">Notification preferences</span>
              </div>
              <Switch
                checked={settings.notificationsEnabled}
                onCheckedChange={(checked) => updateSettings({ notificationsEnabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground font-sans">Streak reminders</span>
              <Switch
                checked={settings.streakReminders}
                onCheckedChange={(checked) => updateSettings({ streakReminders: checked })}
              />
            </div>
            <div className="space-y-1">
              <p className="text-foreground font-sans inline-flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-muted-foreground" />
                Practice time preference
              </p>
              <div className="flex gap-2">
                {[2, 5, 10, 15].map((mins) => (
                  <Button
                    key={mins}
                    variant="secondary"
                    className={settings.practiceMinutes === mins ? "btn-warm" : "btn-glass"}
                    onClick={() => updateSettings({ practiceMinutes: mins })}
                  >
                    {mins}m
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="section-divider" />

          <div className="space-y-3">
            <p className="text-sm uppercase tracking-wide text-muted-foreground font-sans">Account</p>
            <Button
              variant="secondary"
              className="btn-glass"
              onClick={() => navigate("/onboarding/questionnaire?returnTo=profile")}
            >
              Edit demographics (full form)
            </Button>
            <div className="grid sm:grid-cols-3 gap-2">
              <Input
                className="input-glass h-10"
                placeholder="Age range"
                value={demographics?.ageRange ?? ""}
                onChange={(e) =>
                  setDemographics((prev) =>
                    prev
                      ? { ...prev, ageRange: e.target.value }
                      : { gender: "", ageRange: e.target.value, country: "", currentRole: "", hobbies: "" }
                  )
                }
              />
              <Input
                className="input-glass h-10"
                placeholder="Current role"
                value={demographics?.currentRole ?? ""}
                onChange={(e) =>
                  setDemographics((prev) =>
                    prev
                      ? { ...prev, currentRole: e.target.value }
                      : { gender: "", ageRange: "", country: "", currentRole: e.target.value, hobbies: "" }
                  )
                }
              />
              <Input
                className="input-glass h-10"
                placeholder="Interests"
                value={demographics?.hobbies ?? ""}
                onChange={(e) =>
                  setDemographics((prev) =>
                    prev
                      ? { ...prev, hobbies: e.target.value }
                      : { gender: "", ageRange: "", country: "", currentRole: "", hobbies: e.target.value }
                  )
                }
              />
            </div>
            <Button className="btn-glass" onClick={saveDemographicsUpdate}>
              Save Demographics
            </Button>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-sans inline-flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email (future account system)
              </p>
              <Input
                className="input-glass h-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
              />
            </div>
          </div>

          <div className="section-divider" />

          <div className="space-y-3">
            <p className="text-sm uppercase tracking-wide text-muted-foreground font-sans">Data & Privacy</p>
            <div className="flex flex-wrap gap-2">
              <Button className="btn-glass" onClick={handleExportData}>
                <Download className="w-4 h-4 mr-1" />
                Export All Data
              </Button>
              <Button variant="secondary" className="btn-glass" onClick={handleClearHistory}>
                <Eraser className="w-4 h-4 mr-1" />
                Clear Exercise History
              </Button>
              <Button variant="destructive" className="btn-glass" onClick={handleDeleteAccount}>
                <ShieldAlert className="w-4 h-4 mr-1" />
                Delete Account
              </Button>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 space-y-4" hover={false}>
          <h2 className="text-xl font-serif text-foreground">Achievements Showcase</h2>
          {topAchievements.length === 0 ? (
            <p className="text-sm text-muted-foreground font-sans">
              Start practicing to unlock your first achievements.
            </p>
          ) : (
            <div className="space-y-2">
              {topAchievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-3">
                  <span className="text-xl">{achievement.icon}</span>
                  <div>
                    <p className="text-foreground font-sans">{achievement.name}</p>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button variant="secondary" className="btn-glass" onClick={() => navigate("/communication-profile")}>
            View All Achievements
          </Button>
        </GlassCard>

        <GlassCard className="p-6 space-y-4" hover={false}>
          <h2 className="text-xl font-serif text-foreground">About</h2>
          <p className="text-sm text-muted-foreground font-sans">Version {version}</p>
          <div className="meta-row">
            <span className="meta-chip">How to use guide (coming soon)</span>
            <span className="meta-chip">Contact/feedback (coming soon)</span>
            <span className="meta-chip">Privacy policy (placeholder)</span>
          </div>
          <div className="section-divider" />
          <p className="text-sm text-muted-foreground font-sans inline-flex items-center gap-2">
            <UserRound className="w-4 h-4" />
            Local profile mode (no server account yet)
          </p>
          <Button
            variant="secondary"
            className="btn-glass w-full justify-center"
            onClick={() => navigate("/dashboard")}
          >
            <LogOut className="w-4 h-4 mr-1" />
            Exit
          </Button>
        </GlassCard>
      </div>
    </div>
  );
};

export default ProfilePage;
