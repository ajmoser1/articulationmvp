import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, MessageCircle, RefreshCw, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getDemographics, getExerciseHistory, type UserDemographics } from "@/lib/persistence";
import { GlassCard } from "@/components/ui/glass-card";
import { WatercolorBlob } from "@/components/ui/WatercolorBlob";

const FALLBACK_TOPICS = [
  "Describe your morning routine",
  "Tell me about a place you enjoy visiting",
];

const TopicSelection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [topics, setTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [demographics, setDemographics] = useState<UserDemographics | null>(null);

  const fetchTopics = async (demo: UserDemographics) => {
    setIsLoading(true);
    try {
      const history = getExerciseHistory();
      const recentTopics = history
        .slice(-10)
        .map((entry) => entry.topic)
        .filter((topic) => topic && topic.trim() !== "");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-topics`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            gender: demo.gender,
            ageRange: demo.ageRange,
            country: demo.country,
            currentRole: demo.currentRole,
            hobbies: demo.hobbies,
            recentTopics: recentTopics.length > 0 ? recentTopics : undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          toast({
            title: "Rate Limited",
            description: errorData.error || "Please wait a moment and try again.",
            variant: "destructive",
          });
        } else if (response.status === 402) {
          toast({
            title: "Credits Required",
            description: errorData.error || "AI credits are exhausted.",
            variant: "destructive",
          });
        }
        throw new Error(errorData.error || "Failed to generate topics");
      }

      const data = await response.json();
      setTopics(data.topics);
    } catch (error) {
      console.error("Failed to fetch topics:", error);
      setTopics(FALLBACK_TOPICS);
      toast({
        title: "Using default topics",
        description: "We couldn't generate personalized topics, so we're showing defaults.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const demo = getDemographics();
    if (!demo) {
      navigate("/questionnaire");
      return;
    }

    setDemographics(demo);
    fetchTopics(demo);
  }, [navigate]);

  const handleTopicSelect = (topic: string) => {
    localStorage.setItem("selectedTopic", topic);
    navigate("/practice");
  };

  const handleRefresh = () => {
    if (demographics) {
      fetchTopics(demographics);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-layered px-6 py-8 pb-24 flex flex-col relative page-transition">
      <WatercolorBlob position="center-top" colorScheme="green-purple" size={620} />
      <WatercolorBlob position="top-right" colorScheme="purple-pink" size={450} />
      {/* Header */}
      <div className="mb-8 flex items-center justify-between relative z-10">
        <button
          onClick={() => navigate("/questionnaire")}
          className="flex items-center gap-2 h-11 px-4 text-muted-foreground hover:text-foreground transition-colors font-sans text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          {!isLoading && (
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 h-11 px-4 btn-glass text-foreground font-sans text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              New topics
            </button>
          )}
          <button
            onClick={() => navigate("/questionnaire")}
            className="h-11 w-11 flex items-center justify-center glass-subtle text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Edit demographics"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full flex flex-col relative z-10">
        {/* Title */}
        <div className="mb-8 opacity-0 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
            Choose a topic
          </h1>
          <p className="text-muted-foreground font-serif">
            Pick a topic to practice speaking about for 45-60 seconds
          </p>
        </div>

        {/* Topics */}
        <div className="flex-1 flex flex-col gap-4">
          {isLoading ? (
            <GlassCard 
              className="flex-1 flex flex-col items-center justify-center gap-4 p-8 opacity-0 animate-fade-in" 
              style={{ animationDelay: "0.2s" }}
              hover={false}
            >
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-muted-foreground font-serif text-center">
                Generating personalized topics...
              </p>
            </GlassCard>
          ) : (
            topics.map((topic, index) => (
              <GlassCard
                key={index}
                variant="interactive"
                className="p-6 opacity-0 animate-fade-in"
                style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                onClick={() => handleTopicSelect(topic)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full glass-subtle flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground font-serif text-lg leading-relaxed">
                      {topic}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))
          )}
        </div>

        {/* Hint */}
        {!isLoading && (
          <p
            className="text-center text-sm text-muted-foreground mt-8 font-sans opacity-0 animate-fade-in"
            style={{ animationDelay: "0.5s" }}
          >
            Tap a topic to start your practice session
          </p>
        )}
      </div>
    </div>
  );
};

export default TopicSelection;
