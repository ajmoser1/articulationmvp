import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gender, ageRange, country, currentRole, hobbies, recentTopics } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Small random seed to encourage varied outputs even for identical demographics
    const seed = Math.random().toString(36).slice(2, 8);

    // Theme clusters so we can nudge toward different types each request (helps when there's no history yet)
    const themeClusters = [
      "work, school, or career",
      "hobbies and free time",
      "technology and the internet",
      "travel, places, or local area",
      "relationships, family, or social life",
      "goals, aspirations, or the future",
      "daily life and routines",
      "food, cooking, or local spots",
      "sports, fitness, or outdoor activities",
      "media, entertainment, or pop culture",
    ];
    const shuffled = [...themeClusters].sort(() => Math.random() - 0.5);
    const emphasis = shuffled.slice(0, 2).join(" and ");
    const themeHint = `For this request, lean toward topics about ${emphasis}. Do not default to morning routines or comfort food unless they fit this emphasis.`;

    // Build prompt with variety emphasis and optional recent topics avoidance
    let recentTopicsNote = "";
    if (Array.isArray(recentTopics) && recentTopics.length > 0) {
      const topicsList = recentTopics
        .slice(0, 10)
        .map((t: string) => `- "${t}"`)
        .join("\n");
      recentTopicsNote = `\n\nIMPORTANT: The user has recently practiced with these topics. Avoid generating topics that are too similar to these:\n${topicsList}\n\nGenerate topics that feel fresh and different from the ones listed above.`;
    }

    const hobbiesList =
      typeof hobbies === "string" && hobbies.trim().length > 0
        ? hobbies
            .split(",")
            .map((h: string) => h.trim())
            .filter(Boolean)
            .slice(0, 6)
            .join(", ")
        : "";

    const roleText = typeof currentRole === "string" && currentRole.trim().length > 0
      ? currentRole.trim()
      : "person";

    const interestsText = hobbiesList.length > 0
      ? `Their interests include: ${hobbiesList}.`
      : "";

    const prompt = `Seed: ${seed}.

${themeHint}

Generate 2 casual conversation topics for a ${gender} ${roleText} who lives in ${country} between the ages of ${ageRange}. ${interestsText}

Requirements:
- Each topic should be something they can speak about naturally for about 2 minutes and might elicit filler words.
- Topics should relate to their interests or daily experiences when possible.
- The two topics should feel clearly different from each other.${recentTopicsNote}

Return the topics as a simple JSON array of exactly 2 strings, with no extra text or formatting.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        // Introduce some randomness so topics vary between calls
        temperature: 0.8,
        top_p: 0.9,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that generates conversation topics. Always respond with a valid JSON array of exactly 2 topic strings. No other text or formatting.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Try to parse the JSON array from the response
    let topics: string[];
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      topics = JSON.parse(cleanContent);
      
      if (!Array.isArray(topics) || topics.length < 2) {
        throw new Error("Invalid topics format");
      }
    } catch {
      console.error("Failed to parse topics:", content);
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify({ topics: topics.slice(0, 2) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-topics error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
