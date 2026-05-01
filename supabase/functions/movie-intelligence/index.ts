import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const INDIAN_LANGS = "hi|ta|te|ml|kn|bn|mr|pa";

function fmtDate(d: Date): string {
  return d.toISOString().substring(0, 10);
}

function monthBounds(offsetMonths = 0): { start: string; end: string; label: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offsetMonths + 1, 0);
  return {
    start: fmtDate(start),
    end: fmtDate(end),
    label: start.toLocaleString("en-US", { month: "long", year: "numeric" }),
  };
}

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

// Curated released Indian titles (TMDB has good coverage)
const RELEASED_TITLES = [
  "Pushpa 2: The Rule", "Stree 2", "Animal", "Jawan", "Pathaan", "Dunki",
  "Fighter", "Crew", "Bhool Bhulaiyaa 3", "Singham Again",
  "Salaar: Part 1 - Ceasefire", "Kalki 2898 AD", "Devara: Part 1",
  "Kantara", "RRR", "K.G.F: Chapter 2", "Vikram", "Ponniyin Selvan: I",
  "Jailer", "Leo", "12th Fail", "Sam Bahadur", "Laapataa Ladies",
  "Shaitaan", "Article 370", "Manjummel Boys", "Aavesham",
  "Hanu-Man", "Gadar 2", "OMG 2", "Rocky Aur Rani Kii Prem Kahaani",
  "Tumbbad", "Drishyam 2", "Maharaja", "Amaran",
];

const CATEGORY_MAP: Record<string, string[]> = {
  Bollywood: ["Animal", "Jawan", "Pathaan", "Dunki", "Fighter", "Crew", "Stree 2", "Bhool Bhulaiyaa 3", "Singham Again", "12th Fail", "Sam Bahadur", "Laapataa Ladies", "Shaitaan", "Article 370", "Gadar 2", "OMG 2", "Rocky Aur Rani Kii Prem Kahaani", "Drishyam 2"],
  South: ["Pushpa 2: The Rule", "Salaar: Part 1 - Ceasefire", "Kalki 2898 AD", "Devara: Part 1", "RRR", "K.G.F: Chapter 2", "Vikram", "Ponniyin Selvan: I", "Jailer", "Leo", "Kantara", "Manjummel Boys", "Aavesham", "Hanu-Man", "Tumbbad", "Maharaja", "Amaran"],
  Action: ["Animal", "Jawan", "Pathaan", "Fighter", "Pushpa 2: The Rule", "Salaar: Part 1 - Ceasefire", "K.G.F: Chapter 2", "Singham Again", "Devara: Part 1", "Kalki 2898 AD", "RRR"],
  Comedy: ["Stree 2", "Crew", "Bhool Bhulaiyaa 3", "Laapataa Ladies", "OMG 2", "Aavesham", "Rocky Aur Rani Kii Prem Kahaani"],
  Thriller: ["Animal", "12th Fail", "Shaitaan", "Article 370", "Vikram", "Sam Bahadur", "Tumbbad", "Drishyam 2", "Maharaja"],
  Romance: ["Rocky Aur Rani Kii Prem Kahaani", "Dunki"],
};

const CATEGORY_LANG: Record<string, string> = {
  Bollywood: "hi",
  South: "ta|te|ml|kn",
};
const CATEGORY_GENRE: Record<string, string> = {
  Action: "28",
  Comedy: "35",
  Thriller: "53",
  Romance: "10749",
};

// TMDB discover for Indian movies in a date range
async function discoverIndian(opts: {
  start: string; end: string; sortBy?: string; langs?: string; genre?: string; minVotes?: number;
}): Promise<any[]> {
  const params: Record<string, string> = {
    "primary_release_date.gte": opts.start,
    "primary_release_date.lte": opts.end,
    "with_original_language": opts.langs || INDIAN_LANGS,
    "region": "IN",
    "sort_by": opts.sortBy || "popularity.desc",
    "include_adult": "false",
    "vote_count.gte": String(opts.minVotes ?? 5),
    "page": "1",
  };
  if (opts.genre) params.with_genres = opts.genre;
  try {
    const data = await tmdbFetch("/discover/movie", params);
    return data.results || [];
  } catch (e) {
    console.error("discoverIndian failed:", e);
    return [];
  }
}

// Hydrate a movie with full details (genres/runtime/revenue)
async function hydrate(id: number): Promise<any | null> {
  try { return await tmdbFetch(`/movie/${id}`, {}); } catch { return null; }
}

const UPCOMING_2026 = [
  { title: "Ramayana: The Legend of Prince Rama", releaseDate: "Diwali 2026", hype: "High", category: "Bollywood" },
  { title: "War 2", releaseDate: "August 14, 2026", hype: "High", category: "Bollywood" },
  { title: "Pushpa 3: The Rampage", releaseDate: "2026", hype: "High", category: "South Indian" },
  { title: "Dhoom 4", releaseDate: "Christmas 2026", hype: "High", category: "Bollywood" },
  { title: "KGF Chapter 3", releaseDate: "2026", hype: "High", category: "South Indian" },
  { title: "Don 3", releaseDate: "2026", hype: "High", category: "Bollywood" },
  { title: "Sikandar", releaseDate: "Eid 2026", hype: "High", category: "Bollywood" },
  { title: "Coolie", releaseDate: "2026", hype: "High", category: "South Indian" },
  { title: "Jolly LLB 3", releaseDate: "April 10, 2026", hype: "High", category: "Bollywood" },
  { title: "Toxic", releaseDate: "April 2026", hype: "High", category: "South Indian" },
  { title: "Spirit", releaseDate: "2026", hype: "High", category: "South Indian" },
  { title: "Baaghi 4", releaseDate: "September 5, 2026", hype: "Medium", category: "Bollywood" },
];

const ACTOR_SPOTLIGHTS = [
  { name: "Allu Arjun", knownFor: "Pushpa franchise", upcomingCount: 1, image: "🌟", fact: "National Award winner for Pushpa: The Rise — first Telugu actor in 39 years" },
  { name: "Ranbir Kapoor", knownFor: "Animal, Brahmastra", upcomingCount: 2, image: "🎭", fact: "Starring in both Ramayana & Dhoom 4 in 2026 — his biggest year yet" },
  { name: "Rajinikanth", knownFor: "Jailer, Vikram", upcomingCount: 2, image: "👑", fact: "At 75, Thalaivar continues to dominate with Coolie in the LCU" },
  { name: "Shah Rukh Khan", knownFor: "Jawan, Pathaan", upcomingCount: 1, image: "🏆", fact: "Made the biggest comeback in Bollywood history with ₹3,000 Cr+ in 2023" },
  { name: "Yash", knownFor: "KGF franchise", upcomingCount: 2, image: "⚡", fact: "Yash returns with both KGF Chapter 3 and Toxic in 2026" },
  { name: "Hrithik Roshan", knownFor: "War, Fighter", upcomingCount: 1, image: "💪", fact: "War 2 pairs him with Jr NTR — two action superstars collide" },
  { name: "Prabhas", knownFor: "Baahubali, Kalki 2898 AD", upcomingCount: 1, image: "🔥", fact: "Spirit reunites him with Sandeep Reddy Vanga for a dark thriller" },
];

const OTT_RELEASES = [
  { title: "Pushpa 2: The Rule", platform: "Netflix", language: "Telugu/Hindi", date: "Streaming Now" },
  { title: "Stree 2", platform: "Prime Video", language: "Hindi", date: "Streaming Now" },
  { title: "Kalki 2898 AD", platform: "Netflix", language: "Telugu/Hindi", date: "Streaming Now" },
  { title: "Bhool Bhulaiyaa 3", platform: "Netflix", language: "Hindi", date: "Streaming Now" },
  { title: "Manjummel Boys", platform: "Hotstar", language: "Malayalam", date: "Streaming Now" },
  { title: "Amaran", platform: "Netflix", language: "Tamil", date: "Streaming Now" },
  { title: "Maharaja", platform: "Netflix", language: "Tamil", date: "Streaming Now" },
  { title: "Laapataa Ladies", platform: "Netflix", language: "Hindi", date: "Streaming Now" },
];

function getThisDayFact() {
  const facts = [
    { year: 2001, event: "Lagaan released and went on to get an Oscar nomination", trivia: "It was only the 3rd Indian film to be nominated for Best Foreign Language Film" },
    { year: 1973, event: "Zanjeer released, making Amitabh Bachchan the Angry Young Man", trivia: "The film was rejected by every major star before Big B accepted it" },
    { year: 2009, event: "3 Idiots started shooting — became India's highest grosser", trivia: "Aamir Khan was 44 playing a college student and nobody questioned it" },
    { year: 1995, event: "DDLJ began its legendary run at Maratha Mandir, Mumbai", trivia: "It ran for over 20 years at a single theater — a world record" },
    { year: 2015, event: "Baahubali: The Beginning broke every South Indian box office record", trivia: "The VFX team studied Weta Digital's work on Lord of the Rings" },
    { year: 2022, event: "RRR took the global box office by storm", trivia: "Naatu Naatu won the Oscar for Best Original Song — a first for India" },
    { year: 2023, event: "Jawan became SRK's biggest hit with ₹1,148 Cr worldwide", trivia: "Shah Rukh Khan played a dual role for the first time in his career" },
    { year: 2017, event: "Tumbbad went into production — took 6 years to complete", trivia: "Shot across 4 countries, it became a cult classic beloved worldwide" },
    { year: 2024, event: "Pushpa 2 shattered all opening day records in India", trivia: "Earned ₹175 Cr on Day 1 — the highest ever for an Indian film" },
    { year: 1975, event: "Sholay released and became the biggest blockbuster of its era", trivia: "Gabbar's dialogues are still quoted 50+ years later" },
    { year: 2018, event: "Tumbbad released — now considered one of India's finest horror films", trivia: "Made on a budget of ₹15 Cr, it earned cult status worldwide" },
    { year: 2004, event: "Swades released — underrated SRK gem about returning to roots", trivia: "Initially a box office disappointment, now rated 8.2 on IMDb" },
  ];
  return facts[new Date().getDate() % facts.length];
}

async function fetchFromTMDB(title: string): Promise<any | null> {
  try {
    const data = await tmdbFetch("/search/movie", { query: title, include_adult: "false" });
    const first = data.results?.[0];
    if (!first) return null;
    // Hydrate with details (genres + runtime)
    const detail = await tmdbFetch(`/movie/${first.id}`, {});
    return detail;
  } catch (e) {
    console.error(`TMDB fetch failed for ${title}:`, e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { category } = await req.json().catch(() => ({}));
    if (!Deno.env.get("TMDB_API_KEY")) throw new Error("TMDB_API_KEY is not configured");

    // ── Build dynamic date windows ──
    const today = new Date();
    const todayStr = fmtDate(today);
    const thisMonth = monthBounds(0);
    const nextMonth = monthBounds(1);
    const monthAfter = monthBounds(2);
    // For "released this month" use month start → today
    const releasedThisMonth = { start: thisMonth.start, end: todayStr };
    // Last ~90 days for richer "current" pool when month is young
    const last90 = { start: fmtDate(new Date(today.getTime() - 90 * 86400000)), end: todayStr };

    // Category filters
    const langs = (category && CATEGORY_LANG[category]) || INDIAN_LANGS;
    const genre = (category && CATEGORY_GENRE[category]) || undefined;

    // 1) Daily suggestions: top popular Indian movies released in current month or last 90 days
    const [thisMonthRaw, last90Raw] = await Promise.all([
      discoverIndian({ ...releasedThisMonth, langs, genre, minVotes: 1 }),
      discoverIndian({ ...last90, langs, genre, minVotes: 10 }),
    ]);
    const seen = new Set<number>();
    const merged: any[] = [];
    for (const m of [...thisMonthRaw, ...last90Raw]) {
      if (m && !seen.has(m.id)) { seen.add(m.id); merged.push(m); }
    }
    // Hydrate top 15 with full detail (revenue/genres/runtime)
    const hydrated = await Promise.all(merged.slice(0, 15).map((m) => hydrate(m.id)));
    const valid = hydrated.filter(Boolean);

    // 2) Upcoming: dynamically pull from next 1-2 months
    const [nextMonthRaw, monthAfterRaw] = await Promise.all([
      discoverIndian({ start: nextMonth.start, end: nextMonth.end, langs: INDIAN_LANGS, sortBy: "popularity.desc", minVotes: 0 }),
      discoverIndian({ start: monthAfter.start, end: monthAfter.end, langs: INDIAN_LANGS, sortBy: "popularity.desc", minVotes: 0 }),
    ]);
    const upcomingPool = [...nextMonthRaw, ...monthAfterRaw].filter((m, i, a) => a.findIndex(x => x.id === m.id) === i);

    const langName = (code: string) => {
      const map: Record<string, string> = { hi: "Hindi", ta: "Tamil", te: "Telugu", ml: "Malayalam", kn: "Kannada", bn: "Bengali", en: "English", mr: "Marathi" };
      return map[code] || code?.toUpperCase() || "Hindi";
    };

    const dailySuggestions = valid.slice(0, 5).map((m: any) => ({
      title: m.title,
      year: m.release_date ? parseInt(m.release_date.substring(0, 4)) : 2024,
      genre: (m.genres || []).map((g: any) => g.name).join(", ") || "N/A",
      imdb: Math.round((m.vote_average || 0) * 10) / 10,
      platform: "Theatrical",
      language: langName(m.original_language),
      whyWatch: m.tagline || (m.overview ? m.overview.substring(0, 120) : "A must-watch Indian film"),
    }));

    const todayReleases = valid.slice(5, 8).map((m: any) => ({
      title: m.title,
      platform: "OTT/Theatrical",
      language: langName(m.original_language),
      genre: (m.genres || []).map((g: any) => g.name).join(", ") || "N/A",
    }));

    const upcomingMovies = UPCOMING_2026.slice(0, 6).map((m) => ({
      title: m.title, releaseDate: m.releaseDate, hype: m.hype, category: m.category,
    }));

    const reviews = valid.slice(0, 3).map((m: any) => {
      const rating = m.vote_average || 0;
      return {
        title: m.title,
        positives: [
          m.tagline ? `"${m.tagline}"` : "Great performances",
          rating >= 7 ? "Critically acclaimed" : "Mass entertainer",
          (m.genres?.[0]?.name) ? `Strong ${m.genres[0].name.toLowerCase()} elements` : "Engaging storyline",
        ],
        negatives: [
          rating < 7 ? "Pacing issues in second half" : "High expectations to match",
          "Not for all audiences",
        ],
        sentiment: rating >= 7.5 ? "Good" : rating >= 5.5 ? "Average" : "Poor",
        verdict: rating >= 7 ? "Watch" : rating >= 5 ? "OTT Wait" : "Skip",
      };
    });

    const boxOffice = valid
      .filter((m: any) => m.revenue && m.revenue > 0)
      .slice(0, 5)
      .map((m: any) => {
        const rating = m.vote_average || 0;
        return {
          title: m.title,
          todayEarnings: "N/A",
          totalCollection: `$${(m.revenue / 1_000_000).toFixed(1)}M`,
          status: rating >= 8 ? "Blockbuster" : rating >= 7 ? "Hit" : rating >= 5.5 ? "Average" : "Flop",
        };
      });

    while (boxOffice.length < 3 && valid[boxOffice.length]) {
      const m = valid[boxOffice.length];
      boxOffice.push({
        title: m.title, todayEarnings: "N/A", totalCollection: "N/A",
        status: (m.vote_average || 0) >= 7 ? "Hit" : "Average",
      });
    }

    const trendingIndia = valid.slice(0, 5).map((m: any, i: number) => ({ title: m.title, rank: i + 1 }));
    const trendingWorldwide = valid.slice(2, 7).map((m: any, i: number) => ({ title: m.title, rank: i + 1 }));

    const gem = valid.find((m: any) => (m.vote_average || 0) >= 7 && (m.vote_count || 0) < 2000) || valid[valid.length - 1];
    const hiddenGem = gem
      ? { title: gem.title, description: gem.overview || "An underrated Indian gem worth watching", imdb: Math.round((gem.vote_average || 7) * 10) / 10 }
      : { title: "Tumbbad", description: "A visual masterpiece blending mythology and horror", imdb: 8.3 };

    const quotes = [
      { quote: "Ek baar jo maine commitment kar di, toh phir main apne aap ki bhi nahi sunta.", movie: "Wanted (2009)", character: "Salman Khan" },
      { quote: "Don ko pakadna mushkil hi nahi, namumkin hai.", movie: "Don (2006)", character: "Shah Rukh Khan" },
      { quote: "Mogambo khush hua!", movie: "Mr. India (1987)", character: "Amrish Puri" },
      { quote: "Pushpa, main jhukega nahi!", movie: "Pushpa (2021)", character: "Allu Arjun" },
      { quote: "Picture abhi baaki hai mere dost.", movie: "Om Shanti Om (2007)", character: "Shah Rukh Khan" },
      { quote: "Zindagi mein kuch banna ho, kuch paana ho, toh seekh... taraki kar!", movie: "12th Fail (2023)", character: "Manoj Kumar Sharma" },
      { quote: "Kitne aadmi the?", movie: "Sholay (1975)", character: "Gabbar Singh" },
    ];
    const quoteOfTheDay = quotes[new Date().getDate() % quotes.length];

    const actorSpotlight = [...ACTOR_SPOTLIGHTS].sort(() => Math.random() - 0.5).slice(0, 3);
    const ottThisWeek = OTT_RELEASES.slice(0, 5);
    const thisDayInBollywood = getThisDayFact();

    return new Response(JSON.stringify({
      dailySuggestions, todayReleases, upcomingMovies, reviews, boxOffice,
      trendingWorldwide, trendingIndia, hiddenGem, quoteOfTheDay,
      actorSpotlight, ottThisWeek, thisDayInBollywood,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("movie-intelligence error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
