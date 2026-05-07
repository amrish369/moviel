import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TMDB_BASE = "https://api.themoviedb.org/3";
const INDIAN_LANGS = "hi|ta|te|ml|kn|bn|mr|pa";

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

const langName = (c: string) => ({ hi:"Hindi", ta:"Tamil", te:"Telugu", ml:"Malayalam", kn:"Kannada", bn:"Bengali", mr:"Marathi", en:"English" }[c] || (c||"").toUpperCase());

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!Deno.env.get("TMDB_API_KEY")) throw new Error("TMDB_API_KEY not set");
    const body = await req.json().catch(() => ({}));
    const page: number = Math.max(1, Math.min(20, Number(body.page) || 1));
    const excludeIds: number[] = Array.isArray(body.excludeIds) ? body.excludeIds.slice(0, 500) : [];
    const exclude = new Set<number>(excludeIds);

    const disc = await tmdbFetch("/discover/movie", {
      with_original_language: INDIAN_LANGS,
      sort_by: "popularity.desc",
      include_adult: "false",
      "vote_count.gte": "5",
      page: String(page),
    });

    const candidates = (disc.results || []).filter((m: any) => !exclude.has(m.id)).slice(0, 15);

    const withVideos = await Promise.all(candidates.map(async (m: any) => {
      try {
        const v = await tmdbFetch(`/movie/${m.id}/videos`);
        const trailer = (v.results || []).find((x: any) =>
          x.site === "YouTube" && (x.type === "Trailer" || x.type === "Teaser") && x.official
        ) || (v.results || []).find((x: any) => x.site === "YouTube" && x.type === "Trailer")
          || (v.results || []).find((x: any) => x.site === "YouTube");
        if (!trailer) return null;
        return {
          id: m.id,
          title: m.title || m.name,
          year: m.release_date ? parseInt(m.release_date.substring(0, 4)) : null,
          overview: m.overview || "",
          poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
          backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : null,
          rating: Math.round((m.vote_average || 0) * 10) / 10,
          language: langName(m.original_language),
          youtubeKey: trailer.key,
          videoName: trailer.name,
        };
      } catch { return null; }
    }));

    const items = withVideos.filter(Boolean);
    return new Response(JSON.stringify({ items, page, hasMore: items.length > 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("trailers error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown", items: [], hasMore: false }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
