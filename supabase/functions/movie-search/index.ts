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
    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Search query must be at least 2 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OMDB_API_KEY = Deno.env.get("OMDB_API_KEY");
    if (!OMDB_API_KEY) throw new Error("OMDB_API_KEY is not configured");

    // Use OMDb search API
    const params = new URLSearchParams({ apikey: OMDB_API_KEY, s: query.trim() });
    const res = await fetch(`https://www.omdbapi.com/?${params}`);
    const data = await res.json();

    if (data.Response === "False") {
      return new Response(JSON.stringify({ results: [], message: data.Error || "No results found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch detailed info for top 3 results
    const topResults = (data.Search || []).slice(0, 3);
    const detailed = await Promise.all(
      topResults.map(async (item: any) => {
        try {
          const detailRes = await fetch(
            `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${item.imdbID}&plot=short`
          );
          const d = await detailRes.json();
          return {
            title: d.Title || item.Title,
            year: parseInt(d.Year) || parseInt(item.Year) || 0,
            genre: d.Genre || "N/A",
            imdb: parseFloat(d.imdbRating) || 0,
            platform: d.Type === "series" ? "Streaming" : "Theatrical",
            language: d.Language || "English",
            director: d.Director || "N/A",
            cast: d.Actors ? d.Actors.split(", ") : [],
            plot: d.Plot || "",
            verdict: parseFloat(d.imdbRating) >= 7 ? "Watch" : parseFloat(d.imdbRating) >= 5 ? "OTT Wait" : "Skip",
            whyWatch: d.Plot ? d.Plot.substring(0, 100) : "",
            poster: d.Poster && d.Poster !== "N/A" ? d.Poster : null,
          };
        } catch {
          return {
            title: item.Title,
            year: parseInt(item.Year) || 0,
            genre: "N/A",
            imdb: 0,
            platform: "Unknown",
            language: "English",
          };
        }
      })
    );

    return new Response(JSON.stringify({ results: detailed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("movie-search error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
