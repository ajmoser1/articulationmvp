import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { MessageCircle, Sparkles, Target } from "lucide-react";
import { getDemographics } from "@/lib/persistence";

const Welcome = () => {
  const navigate = useNavigate();

  // If demographics already exist, skip intro + quiz and go straight to topics.
  useEffect(() => {
    const demo = getDemographics();
    if (demo) {
      navigate("/topics", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-layered px-6 py-12 pb-24 flex flex-col">
      {/* Header */}
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        {/* Icon */}
        <div className="mb-8 opacity-0 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="w-16 h-16 rounded-2xl glass-subtle flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-primary" />
          </div>
        </div>

        {/* Main heading */}
        <h1 
          className="text-4xl md:text-5xl font-serif font-bold text-foreground leading-tight mb-4 opacity-0 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          Speak with
          <br />
          <span className="text-primary">clarity</span>
        </h1>

        {/* Description */}
        <p 
          className="text-lg text-muted-foreground font-serif leading-relaxed mb-10 opacity-0 animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          Discover and reduce filler words like "um," "uh," and "like" in your speech. 
          Communicate with confidence and make every word count.
        </p>

        {/* Features in Glass Card */}
        <GlassCard 
          className="p-6 mb-12 opacity-0 animate-fade-in"
          style={{ animationDelay: "0.4s" }}
          hover={false}
        >
          <div className="space-y-4">
            <FeatureItem 
              icon={<Target className="w-5 h-5" />}
              title="Identify patterns"
              description="Understand your unique speech habits"
            />
            <FeatureItem 
              icon={<Sparkles className="w-5 h-5" />}
              title="Practice daily"
              description="Build lasting communication skills"
            />
          </div>
        </GlassCard>

        {/* CTA Button */}
        <div 
          className="opacity-0 animate-fade-in"
          style={{ animationDelay: "0.5s" }}
        >
          <Button 
            onClick={() => navigate("/questionnaire")}
            className="btn-warm w-full py-6 text-lg font-sans"
            size="lg"
          >
            Get Started
          </Button>
          <p className="text-center text-sm text-muted-foreground mt-4 font-sans">
            Takes about 2 minutes to set up
          </p>
        </div>
      </div>
    </div>
  );
};

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureItem = ({ icon, title, description }: FeatureItemProps) => (
  <div className="flex items-start gap-4">
    <div className="w-10 h-10 rounded-xl glass-subtle flex items-center justify-center flex-shrink-0 text-primary">
      {icon}
    </div>
    <div>
      <h3 className="font-sans font-medium text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground font-sans">{description}</p>
    </div>
  </div>
);

export default Welcome;
