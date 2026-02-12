import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getDemographics, saveDemographics } from "@/lib/persistence";
import { GlassCard } from "@/components/ui/glass-card";
import { FuturismBlock } from "@/components/ui/FuturismBlock";

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany",
  "France", "Spain", "Italy", "Netherlands", "Sweden", "Norway", "Denmark",
  "Finland", "Ireland", "New Zealand", "Singapore", "Japan", "South Korea",
  "Brazil", "Mexico", "Argentina", "India", "China", "South Africa",
  "Nigeria", "Kenya", "Egypt", "United Arab Emirates", "Saudi Arabia",
  "Poland", "Czech Republic", "Austria", "Switzerland", "Belgium",
  "Portugal", "Greece", "Turkey", "Russia", "Ukraine", "Philippines",
  "Thailand", "Vietnam", "Indonesia", "Malaysia", "Pakistan", "Bangladesh",
  "Chile", "Colombia", "Peru", "Venezuela", "Other"
].sort();

interface FormData {
  gender: string;
  ageRange: string;
  country: string;
  currentRole: string;
  hobbies: string;
}

interface FormErrors {
  gender?: string;
  ageRange?: string;
  country?: string;
}

const Questionnaire = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const returnToProfile = query.get("returnTo") === "profile";
  const [countryOpen, setCountryOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(() => {
    const saved = getDemographics();
    return {
      gender: saved?.gender ?? "",
      ageRange: saved?.ageRange ?? "",
      country: saved?.country ?? "",
      currentRole: saved?.currentRole ?? "",
      hobbies: saved?.hobbies ?? "",
    };
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.gender) {
      newErrors.gender = "Please select your gender";
    }
    if (!formData.ageRange) {
      newErrors.ageRange = "Please select your age range";
    }
    if (!formData.country) {
      newErrors.country = "Please select your country";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    setTouched({ gender: true, ageRange: true, country: true, currentRole: true, hobbies: true });
    
    if (validateForm()) {
      saveDemographics(formData);
      navigate(returnToProfile ? "/profile" : "/onboarding/topics");
    }
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-layered px-6 py-8 pb-24 flex flex-col relative page-transition">
      <FuturismBlock
        variant="block-2"
        className="top-8 right-[-140px] futurism-strong"
        borderColor="#F72585"
        zIndex={1}
      />
      <FuturismBlock
        variant="triangle-2"
        className="bottom-[-40px] left-[-80px]"
        borderColor="#4CC9F0"
        zIndex={2}
      />
      <FuturismBlock
        variant="stripe-2"
        className="top-24 right-[-140px]"
        zIndex={1}
      />
      <div className="mb-8 relative z-10">
        <button 
          onClick={() => navigate(returnToProfile ? "/profile" : "/onboarding")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-sans text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full relative z-10">
        {/* Title */}
        <div className="mb-8 opacity-0 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
            Tell us about yourself
          </h1>
          <p className="text-muted-foreground font-serif">
            This helps us personalize your experience
          </p>
        </div>

        {/* Form inside Glass Card */}
        <GlassCard 
          className="p-6 md:p-8 opacity-0 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <form 
            className="space-y-6"
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          >
            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender" className="text-foreground font-sans font-medium">
                Gender
              </Label>
              <Select 
                value={formData.gender} 
                onValueChange={(value) => updateField("gender", value)}
              >
                <SelectTrigger 
                  id="gender"
                  className={cn(
                    "h-14 text-base font-sans input-glass",
                    touched.gender && errors.gender && "border-destructive"
                  )}
                >
                  <SelectValue placeholder="Select your gender" />
                </SelectTrigger>
                <SelectContent className="glass-card border-none">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non-binary">Non-binary</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
              {touched.gender && errors.gender && (
                <p className="text-sm text-destructive font-sans">{errors.gender}</p>
              )}
            </div>

            {/* Age Range */}
            <div className="space-y-2">
              <Label htmlFor="ageRange" className="text-foreground font-sans font-medium">
                Age range
              </Label>
              <Select 
                value={formData.ageRange} 
                onValueChange={(value) => updateField("ageRange", value)}
              >
                <SelectTrigger 
                  id="ageRange"
                  className={cn(
                    "h-14 text-base font-sans input-glass",
                    touched.ageRange && errors.ageRange && "border-destructive"
                  )}
                >
                  <SelectValue placeholder="Select your age range" />
                </SelectTrigger>
                <SelectContent className="glass-card border-none">
                  <SelectItem value="under-18">Under 18</SelectItem>
                  <SelectItem value="18-24">18-24</SelectItem>
                  <SelectItem value="25-34">25-34</SelectItem>
                  <SelectItem value="35-44">35-44</SelectItem>
                  <SelectItem value="45-54">45-54</SelectItem>
                  <SelectItem value="55-64">55-64</SelectItem>
                  <SelectItem value="65+">65+</SelectItem>
                </SelectContent>
              </Select>
              {touched.ageRange && errors.ageRange && (
                <p className="text-sm text-destructive font-sans">{errors.ageRange}</p>
              )}
            </div>

            {/* Country - Searchable */}
            <div className="space-y-2">
              <Label htmlFor="country" className="text-foreground font-sans font-medium">
                Country of residence
              </Label>
              <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={countryOpen}
                    className={cn(
                      "w-full h-14 justify-between text-base font-sans font-normal input-glass border",
                      !formData.country && "text-muted-foreground",
                      touched.country && errors.country && "border-destructive"
                    )}
                  >
                    {formData.country || "Search for your country"}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 glass-card border-none" align="start">
                  <Command className="bg-transparent">
                    <CommandInput placeholder="Search countries..." className="h-12" />
                    <CommandList>
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {COUNTRIES.map((country) => (
                          <CommandItem
                            key={country}
                            value={country}
                            onSelect={() => {
                              updateField("country", country);
                              setCountryOpen(false);
                            }}
                            className="py-3 cursor-pointer hover:bg-white/30 dark:hover:bg-white/10 rounded-lg mx-1"
                          >
                            {country}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {touched.country && errors.country && (
                <p className="text-sm text-destructive font-sans">{errors.country}</p>
              )}
            </div>

            {/* Current Role */}
            <div className="space-y-2">
              <Label htmlFor="currentRole" className="text-foreground font-sans font-medium">
                Current role
              </Label>
              <Input
                id="currentRole"
                className="input-glass h-14 text-base font-sans"
                placeholder="college student, high school student"
                value={formData.currentRole}
                onChange={(e) => updateField("currentRole", e.target.value)}
              />
            </div>

            {/* Hobbies & Interests */}
            <div className="space-y-2">
              <Label htmlFor="hobbies" className="text-foreground font-sans font-medium">
                Hobbies & interests
              </Label>
              <Input
                id="hobbies"
                className="input-glass h-14 text-base font-sans"
                placeholder="e.g., photography, hiking, cooking"
                value={formData.hobbies}
                onChange={(e) => updateField("hobbies", e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button 
                type="submit"
                className="btn-warm w-full py-6 text-lg font-sans"
                size="lg"
              >
                {returnToProfile ? "Save & Return to Profile" : "Continue"}
              </Button>
            </div>
          </form>
        </GlassCard>

        {/* Privacy note */}
        <p 
          className="text-center text-sm text-muted-foreground mt-6 font-sans opacity-0 animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          Your information is stored locally and never shared
        </p>
      </div>
    </div>
  );
};

export default Questionnaire;
