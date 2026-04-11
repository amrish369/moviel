import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const today = new Date();
const dateStr = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

const SYSTEM_PROMPT = `You are CineRadar — an AI Movie Intelligence Engine. Today's date is ${dateStr}.

Generate a REAL-TIME daily movie dashboard in valid JSON format. Include the most current, trending, and relevant movies/shows as of today.

STRICT RULES:
- Use REAL movies, shows, and data that are relevant to today's date
- Prioritize currently trending and recently released content
- Mix Bollywood + Hollywood + South Indian + Web Series
- If unsure about specific numbers, use reasonable estimates and mark with ~
- IMDb ratings should be realistic (not all 8+)

Return ONLY a valid JSON object with this exact structure:
{
  "dailySuggestions": [
    { "title": "...", "year": 2026, "genre": "...", "imdb": 8.1, "platform": "...", "language": "...", "whyWatch": "..." }
  ],
  "todayReleases": [
    { "title": "...", "platform": "...", "language": "...", "genre": "..." }
  ],
  "upcomingMovies": [
    { "title": "...", "releaseDate": "...", "hype": "High|Medium|Low", "category": "..." }
  ],
  "reviews": [
    { "title": "...", "positives": ["..."], "negatives": ["..."], "sentiment": "Good|Average|Poor", "verdict": "Watch|Skip|OTT Wait" }
  ],
  "boxOffice": [
    { "title": "...", "todayEarnings": "...", "totalCollection": "...", "status": "Blockbuster|Hit|Average|Flop" }
  ],
  "trendingWorldwide": [{ "title": "...", "rank": 1 }],
  "trendingIndia": [{ "title": "...", "rank": 1 }],
  "hiddenGem": { "title": "...", "description": "...", "imdb": 7.5 },
  "quoteOfTheDay": { "quote": "...", "movie": "...", "character": "..." }
}

dailySuggestions: exactly 5 movies
todayReleases: 2-4 releases (or empty array if none)
upcomingMovies: 5-6 movies in next 7-14 days
reviews: 3 movies with detailed pros/cons
boxOffice: top 5
trending: 5 each for worldwide and India
Return ONLY the JSON, no markdown, no code blocks.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mood, category } = await req.json().catch(() => ({}));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let userPrompt = `Generate today's movie dashboard for ${dateStr}.`;
    if (mood && mood !== "Mixed") {
      userPrompt += ` Focus on ${mood} mood content.`;
    }
    if (category && category !== "All") {
      userPrompt += ` Prioritize ${category} content.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "CREDITS_EXHAUSTED", message: "AI credits exhausted. Using offline data.", fallback: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "RATE_LIMITED", message: "Too many requests. Please try again.", fallback: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON from the AI response, handling possible markdown wrapping
    let movieData;
    try {
      const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      movieData = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse movie data from AI");
    }

    return new Response(JSON.stringify(movieData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("movie-intelligence error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
