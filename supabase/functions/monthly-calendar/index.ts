import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w300";

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

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }

// Categories
const CATEGORIES: Record<string, { langs: string[]; label: string }> = {
  Bollywood: { langs: ["hi"], label: "Bollywood" },
  South: { langs: ["ta", "te", "ml", "kn"], label: "South Indian" },
  Regional: { langs: ["bn", "mr", "pa", "gu", "or"], label: "Regional" },
  Hollywood: { langs: ["en"], label: "Hollywood" },
};

async function discover(opts: {
  start: string; end: string; langs: string[]; region?: string; page: number;
}) {
  const params: Record<string, string> = {
    "primary_release_date.gte": opts.start,
    "primary_release_date.lte": opts.end,
    "with_original_language": opts.langs.join("|"),
    "sort_by": "popularity.desc",
    "include_adult": "false",
    "vote_count.gte": "0",
    "page": String(opts.page),
  };
  if (opts.region) params.region = opts.region;
  try {
    const data = await tmdbFetch("/discover/movie", params);
    return { results: data.results || [], totalPages: data.total_pages || 1, totalResults: data.total_results || 0 };
  } catch (e) {
    console.error("discover failed:", e);
    return { results: [], totalPages: 0, totalResults: 0 };
  }
}

async function fetchAll(opts: { start: string; end: string; langs: string[]; region?: string }) {
  const first = await discover({ ...opts, page: 1 });
  const totalPages = Math.min(first.totalPages, 3); // cap at 3 pages = up to 60 movies
  const all = [...first.results];
  if (totalPages > 1) {
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) => discover({ ...opts, page: i + 2 }))
    );
    for (const r of rest) all.push(...r.results);
  }
  // Dedupe
  const seen = new Set<number>();
  return all.filter((m) => m && !seen.has(m.id) && (seen.add(m.id), true));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!Deno.env.get("TMDB_API_KEY")) throw new Error("TMDB_API_KEY is not configured");
    const { year, month } = await req.json().catch(() => ({}));
    const now = new Date();
    const y = Number(year) || now.getFullYear();
    const m = Number(month); // 1-12
    const mm = m >= 1 && m <= 12 ? m : now.getMonth() + 1;

    const start = `${y}-${pad(mm)}-01`;
    const lastDay = new Date(y, mm, 0).getDate();
    const end = `${y}-${pad(mm)}-${pad(lastDay)}`;
    const todayStr = now.toISOString().substring(0, 10);

    // Fetch each category in parallel
    const entries = Object.entries(CATEGORIES);
    const results = await Promise.all(
      entries.map(([key, cfg]) =>
        fetchAll({ start, end, langs: cfg.langs, region: key === "Hollywood" ? "US" : "IN" })
          .then((movies) => [key, movies] as const)
      )
    );

    const monthEnd = new Date(`${end}T23:59:59`);
    const isPast = monthEnd < now;

    const categories = results.map(([key, movies]) => {
      const released: any[] = [];
      const upcoming: any[] = [];
      for (const m of movies) {
        const rd = m.release_date || "";
        const item = {
          id: m.id,
          title: m.title,
          releaseDate: rd,
          poster: m.poster_path ? `${TMDB_IMG}${m.poster_path}` : null,
          rating: Math.round((m.vote_average || 0) * 10) / 10,
          voteCount: m.vote_count || 0,
          overview: m.overview || "",
          language: m.original_language,
          popularity: m.popularity || 0,
        };
        if (!rd || rd <= todayStr) released.push(item);
        else upcoming.push(item);
      }
      released.sort((a, b) => (a.releaseDate < b.releaseDate ? 1 : -1));
      upcoming.sort((a, b) => (a.releaseDate < b.releaseDate ? -1 : 1));
      return {
        key,
        label: CATEGORIES[key].label,
        total: movies.length,
        releasedCount: released.length,
        upcomingCount: upcoming.length,
        released,
        upcoming,
      };
    });

    const monthLabel = new Date(y, mm - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
    const totalAll = categories.reduce((s, c) => s + c.total, 0);

    return new Response(JSON.stringify({
      year: y, month: mm, monthLabel, isPast, total: totalAll, categories,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("monthly-calendar error:", error);
    return new Response(JSON.stringify({ error: "An error occurred. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});