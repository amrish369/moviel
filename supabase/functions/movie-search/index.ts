import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

function tmdbAuth() {
  const key = Deno.env.get("TMDB_API_KEY") || "";
  if (key.startsWith("eyJ") || key.length > 60) {
    return { headers: { Authorization: `Bearer ${key}` }, keyParam: "" };
  }
  return { headers: {}, keyParam: key };
}

async function tmdbFetch(path: string, query: Record<string, string> = {}) {
  const auth = tmdbAuth();
  const params = new URLSearchParams(query);
  if (auth.keyParam) params.set("api_key", auth.keyParam);
  const res = await fetch(`${TMDB_BASE}${path}?${params}`, { headers: auth.headers });
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${await res.text()}`);
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Query must be at least 2 characters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Deno.env.get("TMDB_API_KEY")) throw new Error("TMDB_API_KEY not configured");

    const data = await tmdbFetch("/search/movie", {
      query: query.trim(), include_adult: "false", language: "en-US",
    });

    const top = (data.results || []).slice(0, 8);
    const detailed = await Promise.all(top.map(async (item: any) => {
      try {
        const d = await tmdbFetch(`/movie/${item.id}`, { append_to_response: "credits" });
        const directorObj = d.credits?.crew?.find((c: any) => c.job === "Director");
        const cast = (d.credits?.cast || []).slice(0, 5).map((c: any) => c.name);
        const rating = d.vote_average || 0;
        return {
          title: d.title,
          year: d.release_date ? parseInt(d.release_date.substring(0, 4)) : 0,
          genre: (d.genres || []).map((g: any) => g.name).join(", ") || "N/A",
          imdb: Math.round(rating * 10) / 10,
          platform: "Theatrical",
          language: d.original_language?.toUpperCase() || "EN",
          director: directorObj?.name || "N/A",
          cast,
          plot: d.overview || "",
          verdict: rating >= 7 ? "Watch" : rating >= 5 ? "OTT Wait" : "Skip",
          whyWatch: d.tagline || (d.overview ? d.overview.substring(0, 100) : ""),
          poster: d.poster_path ? `${TMDB_IMG}${d.poster_path}` : null,
        };
      } catch {
        return {
          title: item.title, year: item.release_date ? parseInt(item.release_date.substring(0, 4)) : 0,
          genre: "N/A", imdb: item.vote_average || 0, platform: "Unknown", language: "EN",
        };
      }
    }));

    return new Response(JSON.stringify({ results: detailed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("movie-search error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
