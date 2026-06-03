import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TMDB_BASE = "https://api.themoviedb.org/3";
const INDIAN_LANGS = "hi|ta|te|ml|kn|bn|mr|pa";
const LANG_MAP: Record<string, string> = {
  hi: "Hindi", ta: "Tamil", te: "Telugu", ml: "Malayalam",
  kn: "Kannada", bn: "Bengali", mr: "Marathi", pa: "Punjabi", en: "English",
};
const langName = (c: string) => LANG_MAP[c] || (c || "").toUpperCase() || "Hindi";

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

const fmtDate = (d: Date) => d.toISOString().substring(0, 10);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!Deno.env.get("TMDB_API_KEY")) throw new Error("TMDB_API_KEY not configured");
    const body = await req.json().catch(() => ({}));
    const requestedPage = Math.max(1, Math.min(50, Number(body.page) || 1));
    const refresh = Boolean(body.refresh);
    // On refresh, pick a random page within a wider window so the user sees fresh trailers
    const page = refresh ? Math.floor(Math.random() * 8) + 1 : requestedPage;
    const excludeIds: number[] = Array.isArray(body.excludeIds) ? body.excludeIds : [];
    const excluded = new Set(excludeIds);

    const today = new Date();
    const last180 = fmtDate(new Date(today.getTime() - 180 * 86400000));
    const todayStr = fmtDate(today);

    const streams = await Promise.all([
      tmdbFetch("/discover/movie", {
        with_original_language: INDIAN_LANGS,
        "primary_release_date.gte": last180,
        "primary_release_date.lte": todayStr,
        sort_by: "popularity.desc", include_adult: "false",
        "vote_count.gte": "3", page: String(page),
      }).catch(() => ({ results: [] })),
      tmdbFetch("/discover/movie", {
        with_original_language: INDIAN_LANGS,
        sort_by: "popularity.desc", include_adult: "false",
        "vote_count.gte": "30", page: String(page),
      }).catch(() => ({ results: [] })),
    ]);

    const seen = new Set<number>();
    const pool: any[] = [];
    for (const s of streams) for (const m of (s.results || [])) {
      if (!m || seen.has(m.id) || excluded.has(m.id)) continue;
      seen.add(m.id); pool.push(m);
    }
    // Shuffle so each refresh feels different
    pool.sort(() => Math.random() - 0.5);

    const items: any[] = [];
    for (const m of pool) {
      if (items.length >= 10) break;
      try {
        const videos = await tmdbFetch(`/movie/${m.id}/videos`);
        const yt = (videos.results || []).filter((v: any) => v.site === "YouTube");
        const trailer = yt.find((v: any) => v.type === "Trailer" && v.official)
          || yt.find((v: any) => v.type === "Trailer")
          || yt.find((v: any) => v.type === "Teaser")
          || yt[0];
        if (!trailer) continue;
        items.push({
          id: m.id,
          title: m.title || m.name,
          year: m.release_date ? parseInt(m.release_date.substring(0, 4)) : null,
          overview: m.overview || "",
          poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
          backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w780${m.backdrop_path}` : null,
          rating: Math.round((m.vote_average || 0) * 10) / 10,
          language: langName(m.original_language),
          youtubeKey: trailer.key,
          videoName: trailer.name,
        });
      } catch { /* skip */ }
    }

    return new Response(JSON.stringify({ items, page, hasMore: items.length > 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({
      error: "An error occurred. Please try again.", items: [], hasMore: false,
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});