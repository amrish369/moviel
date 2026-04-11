import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title } = await req.json();
    if (!title || typeof title !== "string" || title.trim().length < 1) {
      return new Response(JSON.stringify({ error: "Movie title is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a comprehensive movie database. Given a movie/series title, return DETAILED info as a single JSON object. Use REAL data only.

Return ONLY valid JSON (no markdown). Structure:
{
  "title": "Full Official Title",
  "year": 2024,
  "genre": "Action/Drama",
  "imdb": 7.5,
  "runtime": "2h 15m",
  "certification": "UA / PG-13",
  "language": "Hindi",
  "country": "India",
  "tagline": "A catchy tagline if exists",
  "plot": "Detailed 3-4 line plot synopsis without spoilers",
  "director": { "name": "Director Name", "knownFor": ["Other Movie 1", "Other Movie 2"] },
  "writers": [{ "name": "Writer Name", "role": "Screenplay/Story/Dialogue" }],
  "cast": [
    { "name": "Actor Name", "character": "Character Name", "photoQuery": "actor name headshot" }
  ],
  "producers": ["Producer 1", "Producer 2"],
  "music": "Music Director Name",
  "cinematography": "Cinematographer Name",
  "platform": "Netflix/Theaters/etc",
  "boxOffice": {
    "budget": "₹150 Cr / $200M",
    "openingDay": "₹25 Cr / $50M",
    "totalIndia": "₹300 Cr",
    "totalWorldwide": "$500M",
    "verdict": "Blockbuster/Hit/Average/Flop"
  },
  "ratings": {
    "imdb": 7.5,
    "rottenTomatoes": "85%",
    "audienceScore": "90%"
  },
  "trailerQuery": "movie title official trailer youtube",
  "similarMovies": [
    { "title": "Similar Movie 1", "year": 2023, "imdb": 7.2, "genre": "Action", "whyWatch": "One line reason" },
    { "title": "Similar Movie 2", "year": 2022, "imdb": 7.8, "genre": "Action", "whyWatch": "One line reason" },
    { "title": "Similar Movie 3", "year": 2024, "imdb": 6.9, "genre": "Action", "whyWatch": "One line reason" },
    { "title": "Similar Movie 4", "year": 2023, "imdb": 7.1, "genre": "Action", "whyWatch": "One line reason" },
    { "title": "Similar Movie 5", "year": 2021, "imdb": 8.0, "genre": "Action", "whyWatch": "One line reason" }
  ]
}

Cast: include top 6-8 actors.
Similar movies: exactly 5, same genre/vibe.
Box office: use real numbers with ~ if estimated. Use "N/A" if unreleased or unknown.
If data is unavailable for a field, use null.`,
          },
          {
            role: "user",
            content: `Get complete details for: "${title.trim()}"`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "CREDITS_EXHAUSTED", message: "AI credits exhausted. Showing basic info.", fallback: true }),
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
    if (!content) throw new Error("No content in AI response");

    let movieData;
    try {
      const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      movieData = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse movie detail response:", content);
      throw new Error("Failed to parse movie details");
    }

    return new Response(JSON.stringify(movieData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("movie-detail error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
