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

const CATEGORY_LANG: Record<string, string> = {
  Bollywood: "hi",
  South: "ta|te|ml|kn",
  Hollywood: "en",
  "Web Series": INDIAN_LANGS,
};
const MOOD_GENRE: Record<string, string> = {
  Action: "28", Comedy: "35", Thriller: "53", Romance: "10749", Emotional: "18",
};

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

function mapMovie(m: any) {
  const lang = m.original_language;
  const cat = ["ta", "te", "ml", "kn"].includes(lang) ? "South Indian"
    : lang === "hi" ? "Bollywood"
    : lang === "en" ? "Hollywood" : "Regional";
  return {
    id: m.id,
    title: m.title || m.name,
    year: m.release_date ? parseInt(m.release_date.substring(0, 4)) : null,
    releaseDateRaw: m.release_date || null,
    overview: m.overview || "",
    poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
    backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w780${m.backdrop_path}` : null,
    rating: Math.round((m.vote_average || 0) * 10) / 10,
    voteCount: m.vote_count || 0,
    popularity: m.popularity || 0,
    language: langName(lang),
    langCode: lang,
    category: cat,
    genreIds: m.genre_ids || [],
    revenue: m.revenue || 0,
  };
}

async function discover(opts: {
  page: number; langs: string; genre?: string; sortBy?: string;
  startDate?: string; endDate?: string; minVotes?: number;
}) {
  const params: Record<string, string> = {
    with_original_language: opts.langs,
    sort_by: opts.sortBy || "popularity.desc",
    include_adult: "false",
    "vote_count.gte": String(opts.minVotes ?? 0),
    page: String(opts.page),
  };
  if (opts.genre) params.with_genres = opts.genre;
  if (opts.startDate) params["primary_release_date.gte"] = opts.startDate;
  if (opts.endDate) params["primary_release_date.lte"] = opts.endDate;
  try {
    const data = await tmdbFetch("/discover/movie", params);
    return { results: data.results || [], totalPages: Math.min(data.total_pages || 1, 500) };
  } catch (e) {
    console.error("discover failed", e);
    return { results: [], totalPages: 0 };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!Deno.env.get("TMDB_API_KEY")) throw new Error("TMDB_API_KEY not configured");
    const body = await req.json().catch(() => ({}));
    const section = String(body.section || "daily");
    const page = Math.max(1, Math.min(500, Number(body.page) || 1));
    const mood = body.mood && body.mood !== "Mixed" ? String(body.mood) : null;
    const category = body.category && body.category !== "All" ? String(body.category) : null;

    const langs = (category && CATEGORY_LANG[category]) || INDIAN_LANGS;
    const genre = mood ? MOOD_GENRE[mood] : undefined;

    const today = new Date();
    const todayStr = fmtDate(today);
    const last90 = fmtDate(new Date(today.getTime() - 90 * 86400000));
    const last7 = fmtDate(new Date(today.getTime() - 7 * 86400000));
    const next180 = fmtDate(new Date(today.getTime() + 180 * 86400000));

    let items: any[] = [];
    let totalPages = 1;

    if (section === "daily" || section === "ott") {
      const r = await discover({
        page, langs, genre, startDate: last90, endDate: todayStr, minVotes: 5,
      });
      items = r.results.map(mapMovie);
      totalPages = r.totalPages;
    } else if (section === "today") {
      const r = await discover({
        page, langs, genre, startDate: last7, endDate: todayStr, minVotes: 0,
      });
      items = r.results.map(mapMovie);
      totalPages = r.totalPages;
    } else if (section === "upcoming") {
      const r = await discover({
        page, langs, genre, startDate: todayStr, endDate: next180, minVotes: 0,
        sortBy: "primary_release_date.asc",
      });
      items = r.results.map(mapMovie);
      totalPages = r.totalPages;
    } else if (section === "reviews") {
      const r = await discover({
        page, langs, genre, startDate: last90, endDate: todayStr, minVotes: 20,
        sortBy: "vote_average.desc",
      });
      items = r.results.map(mapMovie);
      totalPages = r.totalPages;
    } else if (section === "boxoffice") {
      const r = await discover({
        page, langs, genre, startDate: last90, endDate: todayStr, minVotes: 10,
        sortBy: "revenue.desc",
      });
      items = r.results.map(mapMovie).filter((m) => m.popularity > 1);
      totalPages = r.totalPages;
    } else if (section === "trending-india") {
      try {
        const data = await tmdbFetch(`/trending/movie/week`, { page: String(page) });
        items = (data.results || [])
          .filter((m: any) => (langs).split("|").includes(m.original_language))
          .map(mapMovie);
        totalPages = Math.min(data.total_pages || 1, 100);
      } catch { items = []; }
    } else if (section === "trending-worldwide") {
      try {
        const data = await tmdbFetch(`/trending/movie/week`, { page: String(page) });
        items = (data.results || []).map(mapMovie);
        totalPages = Math.min(data.total_pages || 1, 100);
      } catch { items = []; }
    } else if (section === "webseries-released") {
      const data = await tmdbFetch("/discover/tv", {
        with_original_language: langs,
        "first_air_date.gte": fmtDate(new Date(today.getTime() - 365 * 86400000)),
        "first_air_date.lte": todayStr,
        sort_by: "popularity.desc", include_adult: "false",
        "vote_count.gte": "3", page: String(page),
      }).catch(() => ({ results: [], total_pages: 0 }));
      items = (data.results || []).map((s: any) => ({
        id: s.id, title: s.name || s.original_name, overview: s.overview || "",
        poster: s.poster_path ? `https://image.tmdb.org/t/p/w500${s.poster_path}` : null,
        backdrop: s.backdrop_path ? `https://image.tmdb.org/t/p/w780${s.backdrop_path}` : null,
        rating: Math.round((s.vote_average || 0) * 10) / 10,
        language: langName(s.original_language),
        firstAirDate: s.first_air_date || null,
        year: s.first_air_date ? parseInt(s.first_air_date.substring(0, 4)) : null,
      }));
      totalPages = Math.min(data.total_pages || 1, 200);
    } else if (section === "webseries-upcoming") {
      const data = await tmdbFetch("/discover/tv", {
        with_original_language: langs,
        "first_air_date.gte": todayStr,
        "first_air_date.lte": next180,
        sort_by: "popularity.desc", include_adult: "false",
        page: String(page),
      }).catch(() => ({ results: [], total_pages: 0 }));
      items = (data.results || []).map((s: any) => ({
        id: s.id, title: s.name || s.original_name, overview: s.overview || "",
        poster: s.poster_path ? `https://image.tmdb.org/t/p/w500${s.poster_path}` : null,
        backdrop: s.backdrop_path ? `https://image.tmdb.org/t/p/w780${s.backdrop_path}` : null,
        rating: Math.round((s.vote_average || 0) * 10) / 10,
        language: langName(s.original_language),
        firstAirDate: s.first_air_date || null,
        year: s.first_air_date ? parseInt(s.first_air_date.substring(0, 4)) : null,
      }));
      totalPages = Math.min(data.total_pages || 1, 200);
    } else {
      return new Response(JSON.stringify({ error: "Unknown section", items: [], hasMore: false }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      items, page, hasMore: page < totalPages && items.length > 0,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({
      error: "An error occurred. Please try again.",
      items: [], hasMore: false,
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});