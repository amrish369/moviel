import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_PROFILE = "https://image.tmdb.org/t/p/w185";

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
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title } = await req.json();
    if (!title || typeof title !== "string") {
      return new Response(JSON.stringify({ error: "Movie title required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Deno.env.get("TMDB_API_KEY")) throw new Error("TMDB_API_KEY not configured");

    const search = await tmdbFetch("/search/movie", { query: title.trim(), include_adult: "false" });
    const first = search.results?.[0];

    if (!first) {
      return new Response(JSON.stringify({
        fallback: true, message: "Movie not found", title: title.trim(),
        year: new Date().getFullYear(), genre: "Unknown", imdb: 0,
        language: "Unknown", plot: "Movie not found in database.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const d = await tmdbFetch(`/movie/${first.id}`, {
      append_to_response: "credits,external_ids,recommendations,videos",
    });

    const directorObj = d.credits?.crew?.find((c: any) => c.job === "Director");
    const writersList = (d.credits?.crew || [])
      .filter((c: any) => ["Writer", "Screenplay", "Story"].includes(c.job))
      .map((w: any) => ({ name: w.name, role: w.job }));

    const castList = (d.credits?.cast || []).slice(0, 10).map((c: any) => ({
      name: c.name,
      character: c.character || "N/A",
      photoQuery: `${c.name} actor headshot`,
      photo: c.profile_path ? `${TMDB_PROFILE}${c.profile_path}` : null,
    }));

    const dop = d.credits?.crew?.find((c: any) => c.job === "Director of Photography");
    const composer = d.credits?.crew?.find((c: any) => ["Original Music Composer", "Music"].includes(c.job));

    const similar = (d.recommendations?.results || []).slice(0, 6).map((r: any) => ({
      title: r.title,
      year: r.release_date ? parseInt(r.release_date.substring(0, 4)) : 0,
      poster: r.poster_path ? `${TMDB_IMG}${r.poster_path}` : null,
      imdb: Math.round((r.vote_average || 0) * 10) / 10,
    }));

    const vids = d.videos?.results || [];
    const ytTrailer =
      vids.find((x: any) => x.site === "YouTube" && x.type === "Trailer" && x.official) ||
      vids.find((x: any) => x.site === "YouTube" && x.type === "Trailer") ||
      vids.find((x: any) => x.site === "YouTube" && x.type === "Teaser" && x.official) ||
      vids.find((x: any) => x.site === "YouTube" && x.type === "Teaser") ||
      vids.find((x: any) => x.site === "YouTube");

    const movieData = {
      title: d.title,
      year: d.release_date ? parseInt(d.release_date.substring(0, 4)) : 0,
      genre: (d.genres || []).map((g: any) => g.name).join(", ") || "N/A",
      imdb: Math.round((d.vote_average || 0) * 10) / 10,
      runtime: d.runtime ? `${d.runtime} min` : null,
      certification: null,
      language: d.original_language?.toUpperCase() || "N/A",
      country: (d.production_countries || []).map((c: any) => c.name).join(", ") || null,
      tagline: d.tagline || null,
      plot: d.overview || null,
      director: directorObj ? { name: directorObj.name, knownFor: [] } : null,
      writers: writersList,
      cast: castList,
      producers: (d.production_companies || []).map((p: any) => p.name),
      music: composer?.name || null,
      cinematography: dop?.name || null,
      platform: "Theatrical",
      boxOffice: {
        budget: d.budget ? `$${d.budget.toLocaleString()}` : null,
        openingDay: null,
        totalIndia: null,
        totalWorldwide: d.revenue ? `$${d.revenue.toLocaleString()}` : null,
        verdict: null,
      },
      ratings: {
        imdb: Math.round((d.vote_average || 0) * 10) / 10,
        rottenTomatoes: null,
        audienceScore: null,
      },
      trailerQuery: `${d.title} ${d.release_date?.substring(0, 4) || ""} official trailer`,
      youtubeKey: ytTrailer?.key || null,
      videoType: ytTrailer?.type || null,
      poster: d.poster_path ? `${TMDB_IMG}${d.poster_path}` : null,
      similarMovies: similar,
    };

    return new Response(JSON.stringify(movieData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("movie-detail error:", error);
    return new Response(JSON.stringify({ error: "An error occurred. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
