import type { CommunicationScore, UserArchetype } from "@/types/exercise";

export const ARCHETYPES: UserArchetype[] = [
  {
    id: "rapid-thinker",
    name: "The Rapid Thinker",
    description:
      "You generate ideas quickly and clearly, but your delivery can rush ahead of your fluency.",
    strengths: ["Clarity of ideas", "Quick synthesis", "Strong intent"],
    weaknesses: ["Pacing", "Filler words under pressure", "Breath control"],
    recommendedExercises: ["filler-words", "one-minute-explainer"],
  },
  {
    id: "wanderer",
    name: "The Wanderer",
    description:
      "Your thoughts are interesting, but they drift. Tightening structure will improve clarity.",
    strengths: ["Creativity", "Broad perspective"],
    weaknesses: ["Structure", "Clarity under time pressure"],
    recommendedExercises: ["one-minute-explainer", "eliminate-meandering"],
  },
  {
    id: "hedger",
    name: "The Hedger",
    description:
      "You soften your statements with hedges like 'maybe' or 'I think.' Confidence will elevate impact.",
    strengths: ["Thoughtfulness", "Careful framing"],
    weaknesses: ["Confidence", "Directness"],
    recommendedExercises: ["eliminate-meandering", "one-minute-explainer"],
  },
  {
    id: "generic-speaker",
    name: "The Generic Speaker",
    description:
      "You communicate steadily, but precision is low. Specificity will make your message land.",
    strengths: ["Consistency", "Approachability"],
    weaknesses: ["Precision", "Memorable phrasing"],
    recommendedExercises: ["one-minute-explainer", "filler-words"],
  },
  {
    id: "polished-pro",
    name: "The Polished Pro",
    description:
      "You deliver clear, confident, and precise communication with strong impact.",
    strengths: ["Fluency", "Clarity", "Precision", "Confidence", "Impact"],
    weaknesses: ["Complacency risk"],
    recommendedExercises: ["eliminate-meandering", "one-minute-explainer"],
  },
];

export const DEFAULT_ARCHETYPE = ARCHETYPES.find((a) => a.id === "generic-speaker")!;

export function determineArchetype(score: CommunicationScore): UserArchetype | null {
  const { fluency, clarity, precision, confidence, impact } = score;
  const values = [fluency, clarity, precision, confidence, impact].filter(
    (v): v is number => typeof v === "number"
  );

  if (values.length === 0) return null;

  const high = (v: number | null) => typeof v === "number" && v >= 75;
  const low = (v: number | null) => typeof v === "number" && v <= 50;

  if (high(fluency) && high(clarity) && high(precision) && high(confidence) && high(impact)) {
    return ARCHETYPES.find((a) => a.id === "polished-pro") ?? null;
  }

  if (high(clarity) && low(fluency)) {
    return ARCHETYPES.find((a) => a.id === "rapid-thinker") ?? null;
  }

  if (low(clarity) && low(precision)) {
    return ARCHETYPES.find((a) => a.id === "wanderer") ?? null;
  }

  if (low(confidence)) {
    return ARCHETYPES.find((a) => a.id === "hedger") ?? null;
  }

  if (low(precision) && low(impact)) {
    return ARCHETYPES.find((a) => a.id === "generic-speaker") ?? null;
  }

  return DEFAULT_ARCHETYPE;
}
