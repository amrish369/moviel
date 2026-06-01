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

function mapShow(s: any) {
  return {
    id: s.id,
    title: s.name || s.original_name,
    overview: s.overview || "",
    poster: s.poster_path ? `https://image.tmdb.org/t/p/w500${s.poster_path}` : null,
    backdrop: s.backdrop_path ? `https://image.tmdb.org/t/p/w780${s.backdrop_path}` : null,
    rating: Math.round((s.vote_average || 0) * 10) / 10,
    language: langName(s.original_language),
    firstAirDate: s.first_air_date || null,
    year: s.first_air_date ? parseInt(s.first_air_date.substring(0, 4)) : null,
    popularity: s.popularity || 0,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!Deno.env.get("TMDB_API_KEY")) throw new Error("TMDB_API_KEY not configured");
    const body = await req.json().catch(() => ({}));
    const refresh = Boolean(body.refresh);
    const page = refresh ? Math.floor(Math.random() * 4) + 1 : Math.max(1, Number(body.page) || 1);
    const today = new Date();
    const todayStr = fmtDate(today);
    const last365 = fmtDate(new Date(today.getTime() - 365 * 86400000));
    const next180 = fmtDate(new Date(today.getTime() + 180 * 86400000));

    const [releasedRaw, upcomingRaw] = await Promise.all([
      tmdbFetch("/discover/tv", {
        with_original_language: INDIAN_LANGS,
        "first_air_date.gte": last365,
        "first_air_date.lte": todayStr,
        sort_by: "popularity.desc", include_adult: "false",
        "vote_count.gte": "3", page: String(page),
      }).catch(() => ({ results: [] })),
      tmdbFetch("/discover/tv", {
        with_original_language: INDIAN_LANGS,
        "first_air_date.gte": todayStr,
        "first_air_date.lte": next180,
        sort_by: "popularity.desc", include_adult: "false",
        page: String(page),
      }).catch(() => ({ results: [] })),
    ]);

    const released = (releasedRaw.results || []).slice(0, 12).map(mapShow);
    const upcoming = (upcomingRaw.results || []).slice(0, 12).map(mapShow);

    return new Response(JSON.stringify({ released, upcoming }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown",
      released: [], upcoming: [],
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});