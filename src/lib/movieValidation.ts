import type { Movie, Release, Upcoming, Review, BoxOffice, TrendingItem } from "@/data/movieData";

// Validate and sanitize a string field
const sanitizeString = (val: unknown, fallback = "Unknown"): string => {
  if (typeof val !== "string" || val.trim().length === 0) return fallback;
  // Strip potential HTML/script injection
  return val.replace(/<[^>]*>/g, "").trim().slice(0, 500);
};

// Validate a number within range
const sanitizeNumber = (val: unknown, min: number, max: number, fallback: number): number => {
  const num = typeof val === "number" ? val : parseFloat(String(val));
  if (isNaN(num) || num < min || num > max) return fallback;
  return Math.round(num * 10) / 10;
};

// Validate a date string, return "TBA" if invalid
const sanitizeDate = (val: unknown): string => {
  if (typeof val !== "string" || val.trim().length === 0) return "TBA";
  const s = val.trim();
  // Accept common date formats
  if (/^\d{4}-\d{2}-\d{2}$/.test(s) || /^[A-Za-z]+ \d{1,2}, \d{4}$/.test(s) || /^[A-Za-z]+ \d{4}$/.test(s)) {
    return s;
  }
  // Try parsing
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  return "TBA";
};

const validSentiments = ["Good", "Average", "Poor"] as const;
const validVerdicts = ["Watch", "Skip", "OTT Wait"] as const;
const validHype = ["Low", "Medium", "High"] as const;
const validStatus = ["Blockbuster", "Hit", "Average", "Flop"] as const;

export function validateMovie(m: unknown): Movie | null {
  if (!m || typeof m !== "object") return null;
  const obj = m as Record<string, unknown>;
  const title = sanitizeString(obj.title);
  if (title === "Unknown") return null; // title is required
  return {
    title,
    year: sanitizeNumber(obj.year, 1900, 2030, new Date().getFullYear()),
    genre: sanitizeString(obj.genre, "Drama"),
    imdb: sanitizeNumber(obj.imdb, 0, 10, 0),
    platform: sanitizeString(obj.platform, "Unknown"),
    language: sanitizeString(obj.language, "Unknown"),
    whyWatch: typeof obj.whyWatch === "string" ? sanitizeString(obj.whyWatch) : undefined,
  };
}

export function validateRelease(r: unknown): Release | null {
  if (!r || typeof r !== "object") return null;
  const obj = r as Record<string, unknown>;
  const title = sanitizeString(obj.title);
  if (title === "Unknown") return null;
  return {
    title,
    platform: sanitizeString(obj.platform, "Unknown"),
    language: sanitizeString(obj.language, "Unknown"),
    genre: sanitizeString(obj.genre, "Unknown"),
  };
}

export function validateUpcoming(u: unknown): Upcoming | null {
  if (!u || typeof u !== "object") return null;
  const obj = u as Record<string, unknown>;
  const title = sanitizeString(obj.title);
  if (title === "Unknown") return null;
  return {
    title,
    releaseDate: sanitizeDate(obj.releaseDate),
    hype: validHype.includes(obj.hype as any) ? (obj.hype as Upcoming["hype"]) : "Medium",
    category: sanitizeString(obj.category, "Movie"),
  };
}

export function validateReview(r: unknown): Review | null {
  if (!r || typeof r !== "object") return null;
  const obj = r as Record<string, unknown>;
  const title = sanitizeString(obj.title);
  if (title === "Unknown") return null;
  return {
    title,
    positives: Array.isArray(obj.positives) ? obj.positives.map(p => sanitizeString(p)).filter(p => p !== "Unknown") : [],
    negatives: Array.isArray(obj.negatives) ? obj.negatives.map(n => sanitizeString(n)).filter(n => n !== "Unknown") : [],
    sentiment: validSentiments.includes(obj.sentiment as any) ? (obj.sentiment as Review["sentiment"]) : "Average",
    verdict: validVerdicts.includes(obj.verdict as any) ? (obj.verdict as Review["verdict"]) : "OTT Wait",
  };
}

export function validateBoxOffice(b: unknown): BoxOffice | null {
  if (!b || typeof b !== "object") return null;
  const obj = b as Record<string, unknown>;
  const title = sanitizeString(obj.title);
  if (title === "Unknown") return null;
  return {
    title,
    todayEarnings: sanitizeString(obj.todayEarnings, "N/A"),
    totalCollection: sanitizeString(obj.totalCollection, "N/A"),
    status: validStatus.includes(obj.status as any) ? (obj.status as BoxOffice["status"]) : "Average",
  };
}

export function validateTrending(t: unknown): TrendingItem | null {
  if (!t || typeof t !== "object") return null;
  const obj = t as Record<string, unknown>;
  const title = sanitizeString(obj.title);
  if (title === "Unknown") return null;
  return {
    title,
    rank: sanitizeNumber(obj.rank, 1, 100, 1),
  };
}

export function validateDashboardData(raw: Record<string, unknown>) {
  return {
    dailySuggestions: Array.isArray(raw.dailySuggestions)
      ? raw.dailySuggestions.map(validateMovie).filter(Boolean) as Movie[]
      : null,
    todayReleases: Array.isArray(raw.todayReleases)
      ? raw.todayReleases.map(validateRelease).filter(Boolean) as Release[]
      : null,
    upcomingMovies: Array.isArray(raw.upcomingMovies)
      ? raw.upcomingMovies.map(validateUpcoming).filter(Boolean) as Upcoming[]
      : null,
    reviews: Array.isArray(raw.reviews)
      ? raw.reviews.map(validateReview).filter(Boolean) as Review[]
      : null,
    boxOffice: Array.isArray(raw.boxOffice)
      ? raw.boxOffice.map(validateBoxOffice).filter(Boolean) as BoxOffice[]
      : null,
    trendingWorldwide: Array.isArray(raw.trendingWorldwide)
      ? raw.trendingWorldwide.map(validateTrending).filter(Boolean) as TrendingItem[]
      : null,
    trendingIndia: Array.isArray(raw.trendingIndia)
      ? raw.trendingIndia.map(validateTrending).filter(Boolean) as TrendingItem[]
      : null,
    hiddenGem: raw.hiddenGem && typeof raw.hiddenGem === "object"
      ? {
          title: sanitizeString((raw.hiddenGem as any).title),
          description: sanitizeString((raw.hiddenGem as any).description),
          imdb: sanitizeNumber((raw.hiddenGem as any).imdb, 0, 10, 7.0),
        }
      : null,
    quoteOfTheDay: raw.quoteOfTheDay && typeof raw.quoteOfTheDay === "object"
      ? {
          quote: sanitizeString((raw.quoteOfTheDay as any).quote),
          movie: sanitizeString((raw.quoteOfTheDay as any).movie),
          character: sanitizeString((raw.quoteOfTheDay as any).character),
        }
      : null,
  };
}
