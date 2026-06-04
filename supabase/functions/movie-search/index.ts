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
  if (!res.ok) throw new Error(`Upstream API error: ${res.status}`);
  return res.json();
}

// Levenshtein distance for typo-tolerant ranking & "did you mean" hints
function levenshtein(a: string, b: string): number {
  a = a.toLowerCase(); b = b.toLowerCase();
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}
function similarity(a: string, b: string): number {
  const aa = normalizeTitle(a);
  const bb = normalizeTitle(b);
  const dist = levenshtein(aa, bb);
  const maxLen = Math.max(aa.length, bb.length) || 1;
  return 1 - dist / maxLen;
}

function normalizeTitle(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/sh/g, "s")
    .replace(/([bcdfgjklmnpqrstvwxyz])h/g, "$1")
    .replace(/aa/g, "a")
    .replace(/ee/g, "i")
    .replace(/oo/g, "u")
    .replace(/\s+/g, " ")
    .trim();
}

const LANG_MAP: Record<string, string> = {
  hi: "Hindi", ta: "Tamil", te: "Telugu", ml: "Malayalam",
  kn: "Kannada", bn: "Bengali", mr: "Marathi", pa: "Punjabi", en: "English",
};
const langName = (c: string) => LANG_MAP[c] || (c || "").toUpperCase() || "—";

async function searchMulti(q: string) {
  if (!q || q.trim().length < 1) return [];
  try {
    const data = await tmdbFetch("/search/multi", {
      query: q.trim(), include_adult: "false", language: "en-US", page: "1",
    });
    return (data.results || []).filter((r: any) => r.media_type === "movie" || r.media_type === "tv");
  } catch { return []; }
}

function shapeResult(r: any) {
  const isTV = r.media_type === "tv";
  const title = isTV ? (r.name || r.original_name || "") : (r.title || r.original_title || "");
  const dateStr = isTV ? r.first_air_date : r.release_date;
  const year = dateStr ? parseInt(String(dateStr).substring(0, 4)) : 0;
  const rating = r.vote_average || 0;
  return {
    id: r.id,
    title,
    year,
    mediaType: isTV ? "tv" : "movie",
    genre: "N/A",
    imdb: Math.round(rating * 10) / 10,
    platform: isTV ? "Web Series" : "Theatrical",
    language: langName(r.original_language),
    plot: r.overview || "",
    verdict: rating >= 7 ? "Watch" : rating >= 5 ? "OTT Wait" : "Skip",
    whyWatch: r.overview ? r.overview.substring(0, 100) : "",
    poster: r.poster_path ? `${TMDB_IMG}${r.poster_path}` : null,
    popularity: r.popularity || 0,
  };
}

// Typo-tolerant query variants used when the original returns nothing
function fuzzyVariants(q: string): string[] {
  const trimmed = q.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const variants = new Set<string>();
  const normalized = normalizeTitle(trimmed);
  if (normalized && normalized !== trimmed.toLowerCase()) variants.add(normalized);
  variants.add(trimmed.replace(/sh/gi, "s"));
  variants.add(trimmed.replace(/h/gi, ""));
  if (trimmed.length > 3) variants.add(trimmed.slice(0, -1));
  if (trimmed.length > 4) variants.add(trimmed.slice(0, -2));
  if (words.length > 1) {
    variants.add(words.slice(0, -1).join(" "));
    variants.add(words.slice(1).join(" "));
    variants.add(words[0]);
  }
  if (trimmed.length > 5) variants.add(trimmed.slice(0, Math.ceil(trimmed.length * 0.7)));
  return Array.from(variants).map((v) => v.trim()).filter((v) => v && v.toLowerCase() !== trimmed.toLowerCase());
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

    const q = query.trim();
    let raw = await searchMulti(q);
    let didYouMean: string | null = null;

    if (raw.length === 0) {
      for (const variant of fuzzyVariants(q)) {
        const r = await searchMulti(variant);
        if (r.length > 0) {
          raw = r;
          didYouMean = variant;
          break;
        }
      }
    }

    // Rank: blend title similarity with popularity so close matches win.
    const scored = raw.map((r: any) => {
      const item = shapeResult(r);
      const sim = similarity(q, item.title || "");
      const score = sim * 100 + Math.log10((item.popularity || 0) + 1) * 5;
      return { item, sim, score };
    }).sort((a, b) => b.score - a.score);

    const top = scored.slice(0, 12);

    const detailed = await Promise.all(top.map(async ({ item }) => {
      try {
        const path = item.mediaType === "tv" ? `/tv/${item.id}` : `/movie/${item.id}`;
        const d = await tmdbFetch(path, { append_to_response: "credits" });
        const directorObj = item.mediaType === "movie"
          ? d.credits?.crew?.find((c: any) => c.job === "Director")
          : (d.created_by && d.created_by[0]);
        const cast = (d.credits?.cast || []).slice(0, 5).map((c: any) => c.name);
        return {
          ...item,
          genre: (d.genres || []).map((g: any) => g.name).join(", ") || "N/A",
          director: directorObj?.name || "—",
          cast,
          plot: d.overview || item.plot,
          whyWatch: d.tagline || item.whyWatch,
        };
      } catch {
        return item;
      }
    }));

    const suggestions = scored
      .slice(0, 20)
      .filter((s) => s.sim < 1 && s.sim >= 0.4)
      .map((s) => s.item.title)
      .filter((t, i, arr) => t && arr.indexOf(t) === i)
      .slice(0, 5);

    return new Response(JSON.stringify({
      results: detailed,
      suggestions,
      didYouMean,
      query: q,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("movie-search error:", error);
    return new Response(JSON.stringify({ error: "An error occurred. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});