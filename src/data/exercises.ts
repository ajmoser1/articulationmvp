import type { ExerciseConfig } from "@/types/exercise";

export const EXERCISES: ExerciseConfig[] = [
  {
    id: "filler-words",
    name: "Filler Word Cleanup",
    description:
      "Speak naturally while the system detects filler words. Focus on pacing and intentional pauses.",
    shortDescription: "Reduce filler words and improve fluency.",
    estimatedTime: 60,
    type: "verbal",
    category: "fluency",
    tier: "foundation",
    icon: "message-circle",
    impactsScores: ["fluency"],
  },
  {
    id: "one-minute-explainer",
    name: "One-Minute Explainer",
    description:
      "Explain a simple concept in one minute with a clear beginning, middle, and end.",
    shortDescription: "Sharpen structure and clarity in 60 seconds.",
    estimatedTime: 60,
    type: "verbal",
    category: "clarity",
    tier: "foundation",
    icon: "target",
    impactsScores: ["clarity"],
  },
  {
    id: "eliminate-meandering",
    name: "Eliminate Meandering",
    description:
      "Deliver a concise point without drifting. Use short sentences and precise word choices.",
    shortDescription: "Stay on point with precision and clarity.",
    estimatedTime: 75,
    type: "verbal",
    category: "clarity",
    tier: "foundation",
    icon: "sparkles",
    impactsScores: ["clarity", "precision"],
  },
];

export function getExerciseById(id: string): ExerciseConfig | undefined {
  return EXERCISES.find((exercise) => exercise.id === id);
}

export function getExercisesByCategory(category: string): ExerciseConfig[] {
  return EXERCISES.filter((exercise) => exercise.category === category);
}

export function getFoundationExercises(): ExerciseConfig[] {
  return EXERCISES.filter((exercise) => exercise.tier === "foundation");
}
