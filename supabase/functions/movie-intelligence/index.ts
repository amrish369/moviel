import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Indian movies curated list — mix of recent theatrical, OTT, and classics
const INDIAN_TITLES = [
  // 2025-2026 releases
  "Pushpa 2", "Stree 2", "Animal", "Jawan", "Pathaan", "Dunki",
  "Fighter", "Crew", "Bhool Bhulaiyaa 3", "Singham Again",
  "Salaar", "Kalki 2898 AD", "Devara", "Vidaamuyarchi",
  "Kantara", "RRR", "KGF Chapter 2", "Vikram", "Ponniyin Selvan",
  "Jailer", "Leo", "12th Fail", "Sam Bahadur", "Laapataa Ladies",
  "Shaitaan", "Article 370", "Teri Baaton Mein Aisa Uljha Jiya",
  "Manjummel Boys", "Amar Prem Ki Prem Kahani", "Aavesham",
  "Hanuman", "Gadar 2", "OMG 2", "Rocky Aur Rani Kii Prem Kahaani",
];

const CATEGORY_MAP: Record<string, string[]> = {
  Bollywood: ["Animal", "Jawan", "Pathaan", "Dunki", "Fighter", "Crew", "Stree 2", "Bhool Bhulaiyaa 3", "Singham Again", "12th Fail", "Sam Bahadur", "Laapataa Ladies", "Shaitaan", "Article 370", "Gadar 2", "OMG 2", "Rocky Aur Rani Kii Prem Kahaani"],
  South: ["Pushpa 2", "Salaar", "Kalki 2898 AD", "Devara", "RRR", "KGF Chapter 2", "Vikram", "Ponniyin Selvan", "Jailer", "Leo", "Kantara", "Manjummel Boys", "Aavesham", "Hanuman", "Vidaamuyarchi"],
  Action: ["Animal", "Jawan", "Pathaan", "Fighter", "Pushpa 2", "Salaar", "KGF Chapter 2", "Singham Again", "Devara", "Kalki 2898 AD"],
  Comedy: ["Stree 2", "Crew", "Bhool Bhulaiyaa 3", "Laapataa Ladies", "OMG 2", "Aavesham", "Rocky Aur Rani Kii Prem Kahaani"],
  Thriller: ["Animal", "12th Fail", "Shaitaan", "Article 370", "Vikram", "Sam Bahadur"],
  Romance: ["Rocky Aur Rani Kii Prem Kahaani", "Teri Baaton Mein Aisa Uljha Jiya", "Dunki"],
};

async function fetchFromOMDb(apiKey: string, title: string): Promise<any | null> {
  try {
    const params = new URLSearchParams({ apikey: apiKey, t: title, plot: "short" });
    const res = await fetch(`https://www.omdbapi.com/?${params}`);
    const data = await res.json();
    return data.Response === "True" ? data : null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category } = await req.json().catch(() => ({}));

    const OMDB_API_KEY = Deno.env.get("OMDB_API_KEY");
    if (!OMDB_API_KEY) throw new Error("OMDB_API_KEY is not configured");

    let titles = INDIAN_TITLES;
    if (category && category !== "All" && CATEGORY_MAP[category]) {
      titles = CATEGORY_MAP[category];
    }

    // Shuffle and pick 15
    const shuffled = [...titles].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 15);

    const movies = await Promise.all(selected.map((t) => fetchFromOMDb(OMDB_API_KEY, t)));
    const valid = movies.filter(Boolean);

    const dailySuggestions = valid.slice(0, 5).map((m: any) => ({
      title: m.Title,
      year: parseInt(m.Year) || 2024,
      genre: m.Genre || "N/A",
      imdb: parseFloat(m.imdbRating) || 0,
      platform: m.Type === "series" ? "OTT" : "Theatrical",
      language: m.Language?.split(",")?.[0]?.trim() || "Hindi",
      whyWatch: m.Plot && m.Plot !== "N/A" ? m.Plot.substring(0, 120) : "A must-watch Indian film",
    }));

    const todayReleases = valid.slice(5, 8).map((m: any) => ({
      title: m.Title,
      platform: m.Type === "series" ? "OTT" : "Theatrical",
      language: m.Language?.split(",")?.[0]?.trim() || "Hindi",
      genre: m.Genre || "N/A",
    }));

    const upcomingMovies = valid.slice(0, 6).map((m: any) => ({
      title: m.Title,
      releaseDate: m.Released || "TBA",
      hype: parseFloat(m.imdbRating) >= 8 ? "High" : parseFloat(m.imdbRating) >= 6.5 ? "Medium" : "Low",
      category: m.Language?.includes("Hindi") ? "Bollywood" : m.Language?.includes("Telugu") || m.Language?.includes("Tamil") || m.Language?.includes("Malayalam") || m.Language?.includes("Kannada") ? "South Indian" : "Indian",
    }));

    const reviews = valid.slice(0, 3).map((m: any) => {
      const rating = parseFloat(m.imdbRating) || 0;
      return {
        title: m.Title,
        positives: [
          m.Actors ? `Stellar cast: ${m.Actors.split(",")[0]}` : "Great performances",
          m.Director && m.Director !== "N/A" ? `Directed by ${m.Director}` : "Well directed",
          rating >= 7 ? "Critically acclaimed" : "Mass entertainer",
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
      .filter((m: any) => m.BoxOffice && m.BoxOffice !== "N/A")
      .slice(0, 5)
      .map((m: any) => {
        const rating = parseFloat(m.imdbRating) || 0;
        return {
          title: m.Title,
          todayEarnings: "N/A",
          totalCollection: m.BoxOffice,
          status: rating >= 8 ? "Blockbuster" : rating >= 7 ? "Hit" : rating >= 5.5 ? "Average" : "Flop",
        };
      });

    while (boxOffice.length < 3) {
      const m = valid[boxOffice.length];
      if (!m) break;
      boxOffice.push({
        title: m.Title,
        todayEarnings: "N/A",
        totalCollection: "N/A",
        status: parseFloat(m.imdbRating) >= 7 ? "Hit" : "Average",
      });
    }

    const trendingIndia = valid.slice(0, 5).map((m: any, i: number) => ({
      title: m.Title, rank: i + 1,
    }));

    const trendingWorldwide = valid.slice(2, 7).map((m: any, i: number) => ({
      title: m.Title, rank: i + 1,
    }));
    while (trendingWorldwide.length < 5 && valid.length > trendingWorldwide.length) {
      const m = valid[trendingWorldwide.length + 2];
      if (!m) break;
      trendingWorldwide.push({ title: m.Title, rank: trendingWorldwide.length + 1 });
    }

    const gem = valid.find((m: any) => {
      const r = parseFloat(m.imdbRating) || 0;
      const votes = parseInt(m.imdbVotes?.replace(/,/g, "")) || 0;
      return r >= 7 && votes < 300000;
    }) || valid[valid.length - 1];

    const hiddenGem = gem
      ? { title: gem.Title, description: gem.Plot || "An underrated Indian gem worth watching", imdb: parseFloat(gem.imdbRating) || 7.0 }
      : { title: "12th Fail", description: "An inspiring true story of perseverance against all odds", imdb: 8.6 };

    const quotes = [
      { quote: "Ek baar jo maine commitment kar di, toh phir main apne aap ki bhi nahi sunta.", movie: "Wanted (2009)", character: "Salman Khan" },
      { quote: "Don ko pakadna mushkil hi nahi, namumkin hai.", movie: "Don (2006)", character: "Shah Rukh Khan" },
      { quote: "Mogambo khush hua!", movie: "Mr. India (1987)", character: "Amrish Puri" },
      { quote: "Pushpa, main jhukega nahi!", movie: "Pushpa (2021)", character: "Allu Arjun" },
      { quote: "Zindagi mein kuch banna ho, kuch paana ho, toh seekh... taraki kar!", movie: "12th Fail (2023)", character: "Manoj Kumar Sharma" },
      { quote: "Picture abhi baaki hai mere dost.", movie: "Om Shanti Om (2007)", character: "Shah Rukh Khan" },
    ];
    const quoteOfTheDay = quotes[new Date().getDate() % quotes.length];

    return new Response(JSON.stringify({
      dailySuggestions,
      todayReleases,
      upcomingMovies,
      reviews,
      boxOffice,
      trendingWorldwide,
      trendingIndia,
      hiddenGem,
      quoteOfTheDay,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("movie-intelligence error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
