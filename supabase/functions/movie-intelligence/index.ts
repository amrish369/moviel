import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Curated lists of popular/trending movie titles to search on OMDb
const TRENDING_TITLES = [
  "Oppenheimer", "Dune: Part Two", "The Batman", "Spider-Man: No Way Home",
  "Top Gun: Maverick", "Everything Everywhere All at Once", "Barbie",
  "Killers of the Flower Moon", "Poor Things", "The Holdovers",
  "Wonka", "Napoleon", "Aquaman and the Lost Kingdom", "Wish",
  "Animal", "Jawan", "Pathaan", "Dunki", "Fighter", "Crew",
  "Pushpa 2", "Salaar", "RRR", "KGF Chapter 2", "Stree 2",
  "Inside Out 2", "Deadpool & Wolverine", "Furiosa", "Alien Romulus",
  "Gladiator II", "Moana 2", "Wicked", "The Wild Robot",
];

const CATEGORY_TITLES: Record<string, string[]> = {
  Bollywood: ["Animal", "Jawan", "Pathaan", "Dunki", "Fighter", "Crew", "Stree 2", "Pushpa 2"],
  Hollywood: ["Oppenheimer", "Barbie", "Dune: Part Two", "Deadpool & Wolverine", "Inside Out 2", "The Wild Robot", "Gladiator II", "Wicked"],
  South: ["Pushpa 2", "Salaar", "RRR", "KGF Chapter 2", "Kantara", "Ponniyin Selvan", "Jailer", "Leo"],
  Action: ["Top Gun: Maverick", "The Batman", "Fighter", "Jawan", "Pathaan", "Furiosa", "Deadpool & Wolverine"],
  Comedy: ["Barbie", "Wonka", "Crew", "Stree 2", "The Holdovers", "Poor Things"],
  Thriller: ["Oppenheimer", "Killers of the Flower Moon", "Animal", "Dune: Part Two", "Alien Romulus"],
};

async function fetchMovieFromOMDb(apiKey: string, title: string): Promise<any | null> {
  try {
    const params = new URLSearchParams({ apikey: apiKey, t: title, plot: "short" });
    const res = await fetch(`https://www.omdbapi.com/?${params}`);
    const data = await res.json();
    if (data.Response === "True") return data;
    return null;
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

    // Pick titles based on category
    let titlesToFetch = TRENDING_TITLES;
    if (category && category !== "All" && CATEGORY_TITLES[category]) {
      titlesToFetch = CATEGORY_TITLES[category];
    }

    // Shuffle and pick a subset to avoid too many API calls
    const shuffled = [...titlesToFetch].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 15);

    // Fetch all in parallel
    const movies = await Promise.all(
      selected.map((t) => fetchMovieFromOMDb(OMDB_API_KEY, t))
    );
    const valid = movies.filter(Boolean);

    // Build dashboard sections from real OMDb data
    const dailySuggestions = valid.slice(0, 5).map((m: any) => ({
      title: m.Title,
      year: parseInt(m.Year) || 2024,
      genre: m.Genre || "N/A",
      imdb: parseFloat(m.imdbRating) || 0,
      platform: m.Type === "series" ? "Streaming" : "Theatrical",
      language: m.Language?.split(",")?.[0]?.trim() || "English",
      whyWatch: m.Plot && m.Plot !== "N/A" ? m.Plot.substring(0, 120) : "A must-watch film",
    }));

    const todayReleases = valid.slice(5, 8).map((m: any) => ({
      title: m.Title,
      platform: m.Type === "series" ? "Streaming" : "Theatrical",
      language: m.Language?.split(",")?.[0]?.trim() || "English",
      genre: m.Genre || "N/A",
    }));

    const upcomingMovies = valid.slice(0, 6).map((m: any, i: number) => ({
      title: m.Title,
      releaseDate: m.Released || "TBA",
      hype: parseFloat(m.imdbRating) >= 8 ? "High" : parseFloat(m.imdbRating) >= 6.5 ? "Medium" : "Low",
      category: m.Country?.includes("India") ? "Bollywood" : "Hollywood",
    }));

    const reviews = valid.slice(0, 3).map((m: any) => {
      const rating = parseFloat(m.imdbRating) || 0;
      return {
        title: m.Title,
        positives: [
          m.Actors ? `Great cast: ${m.Actors.split(",")[0]}` : "Solid performances",
          m.Director && m.Director !== "N/A" ? `Directed by ${m.Director}` : "Well directed",
          rating >= 7 ? "Critically acclaimed" : "Entertaining watch",
        ],
        negatives: [
          rating < 7 ? "Could be better paced" : "High expectations to meet",
          "Not for everyone",
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

    // If not enough box office data, fill with placeholders
    while (boxOffice.length < 3 && valid.length > boxOffice.length) {
      const m = valid[boxOffice.length];
      if (m) {
        boxOffice.push({
          title: m.Title,
          todayEarnings: "N/A",
          totalCollection: "N/A",
          status: parseFloat(m.imdbRating) >= 7 ? "Hit" : "Average",
        });
      } else break;
    }

    const trendingWorldwide = valid.slice(0, 5).map((m: any, i: number) => ({
      title: m.Title,
      rank: i + 1,
    }));

    const trendingIndia = valid
      .filter((m: any) => m.Country?.includes("India") || m.Language?.includes("Hindi"))
      .slice(0, 5)
      .map((m: any, i: number) => ({ title: m.Title, rank: i + 1 }));

    // Fill India trending if not enough
    if (trendingIndia.length < 5) {
      const remaining = valid
        .filter((m: any) => !trendingIndia.find((t: any) => t.title === m.Title))
        .slice(0, 5 - trendingIndia.length);
      remaining.forEach((m: any, i: number) => {
        trendingIndia.push({ title: m.Title, rank: trendingIndia.length + 1 });
      });
    }

    const gem = valid.find((m: any) => {
      const r = parseFloat(m.imdbRating) || 0;
      const votes = parseInt(m.imdbVotes?.replace(/,/g, "")) || 0;
      return r >= 7 && votes < 200000;
    }) || valid[valid.length - 1];

    const hiddenGem = gem
      ? { title: gem.Title, description: gem.Plot || "A hidden gem worth watching", imdb: parseFloat(gem.imdbRating) || 7.0 }
      : { title: "The Holdovers", description: "A heartwarming comedy-drama", imdb: 7.9 };

    const quotes = [
      { quote: "Why so serious?", movie: "The Dark Knight", character: "Joker" },
      { quote: "I am Iron Man.", movie: "Avengers: Endgame", character: "Tony Stark" },
      { quote: "May the Force be with you.", movie: "Star Wars", character: "Obi-Wan Kenobi" },
      { quote: "To infinity and beyond!", movie: "Toy Story", character: "Buzz Lightyear" },
      { quote: "I'm gonna make him an offer he can't refuse.", movie: "The Godfather", character: "Vito Corleone" },
    ];
    const quoteOfTheDay = quotes[Math.floor(Math.random() * quotes.length)];

    const dashboard = {
      dailySuggestions,
      todayReleases,
      upcomingMovies,
      reviews,
      boxOffice,
      trendingWorldwide,
      trendingIndia,
      hiddenGem,
      quoteOfTheDay,
    };

    return new Response(JSON.stringify(dashboard), {
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
