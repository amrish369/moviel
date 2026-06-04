import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TMDB_BASE = "https://api.themoviedb.org/3";
const INDIAN_LANGS = "hi|ta|te|ml|kn|bn|mr|pa";
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

const langName = (code: string) => {
  const map: Record<string, string> = {
    hi: "Hindi", ta: "Tamil", te: "Telugu", ml: "Malayalam",
    kn: "Kannada", bn: "Bengali", en: "English", mr: "Marathi",
  };
  return map[code] || (code || "").toUpperCase() || "Hindi";
};

function fmtDate(d: Date) { return d.toISOString().substring(0, 10); }

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!Deno.env.get("TMDB_API_KEY")) throw new Error("TMDB_API_KEY not set");
    const body = await req.json().catch(() => ({}));
    const page: number = Math.max(1, Math.min(5000, Number(body.page) || 1));
    const tmdbPage = String(((page - 1) % 500) + 1);
    const excludeIds: number[] = Array.isArray(body.excludeIds) ? body.excludeIds.slice(0, 500) : [];
    const excludeSet = new Set<number>(excludeIds);
    const interests: Record<string, number> = body.interests || {}; // { "genre:28": 3, "lang:hi": 5 }
    const mood = body.mood && body.mood !== "Mixed" ? String(body.mood) : null;
    const category = body.category && body.category !== "All" ? String(body.category) : null;
    const langs = (category && CATEGORY_LANG[category]) || INDIAN_LANGS;
    const genre = mood ? MOOD_GENRE[mood] : undefined;

    const today = new Date();
    const last120 = fmtDate(new Date(today.getTime() - 120 * 86400000));
    const todayStr = fmtDate(today);

    // Build several discovery streams, then merge & rank
    const streams = await Promise.all([
      // Indian latest + popular
      tmdbFetch("/discover/movie", {
        with_original_language: langs,
        ...(genre ? { with_genres: genre } : {}),
        "primary_release_date.gte": last120,
        "primary_release_date.lte": todayStr,
        sort_by: "popularity.desc", include_adult: "false",
        "vote_count.gte": "5", page: tmdbPage,
      }).catch(() => ({ results: [] })),
      // Trending Indian (week)
      tmdbFetch("/trending/movie/week", { page: tmdbPage }).catch(() => ({ results: [] })),
      // Top rated Indian (rotating page)
      tmdbFetch("/discover/movie", {
        with_original_language: langs,
        ...(genre ? { with_genres: genre } : {}),
        sort_by: "vote_average.desc", "vote_count.gte": "300",
        include_adult: "false", page: tmdbPage,
      }).catch(() => ({ results: [] })),
    ]);

    // Merge unique
    const seen = new Set<number>();
    const pool: any[] = [];
    for (const s of streams) {
      for (const m of (s.results || [])) {
        if (!m || seen.has(m.id) || excludeSet.has(m.id)) continue;
        // Indian-only filter for trending stream
        if (!m.original_language || !INDIAN_LANGS.split("|").includes(m.original_language)) {
          // allow English only if user shows interest
          if (!(interests[`lang:${m.original_language}`] > 0)) continue;
        }
        seen.add(m.id);
        pool.push(m);
      }
    }

    // Score with interests
    const scored = pool.map((m) => {
      let score = (m.popularity || 0) * 0.5 + (m.vote_average || 0) * 5;
      const langW = interests[`lang:${m.original_language}`] || 0;
      score += langW * 8;
      for (const g of (m.genre_ids || [])) {
        score += (interests[`genre:${g}`] || 0) * 6;
      }
      // Recency bonus
      if (m.release_date && m.release_date >= last120) score += 12;
      return { m, score };
    }).sort((a, b) => b.score - a.score);

    // Diversity: avoid same language back-to-back
    const ordered: any[] = [];
    const remaining = [...scored];
    while (remaining.length) {
      const lastLang = ordered[ordered.length - 1]?.original_language;
      const idx = remaining.findIndex((x) => x.m.original_language !== lastLang);
      const pick = idx >= 0 ? remaining.splice(idx, 1)[0] : remaining.shift()!;
      ordered.push(pick.m);
    }

    const items = ordered.map((m: any) => ({
      id: m.id,
      title: m.title || m.name,
      year: m.release_date ? parseInt(m.release_date.substring(0, 4)) : null,
      overview: m.overview || "",
      poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
      backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w780${m.backdrop_path}` : null,
      rating: Math.round((m.vote_average || 0) * 10) / 10,
      language: langName(m.original_language),
      langCode: m.original_language,
      genreIds: m.genre_ids || [],
      popularity: m.popularity || 0,
      releaseDate: m.release_date || null,
    }));

    return new Response(JSON.stringify({ items, page, hasMore: items.length > 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("feed error:", e);
    return new Response(JSON.stringify({ error: "An error occurred. Please try again.", items: [], hasMore: false }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});