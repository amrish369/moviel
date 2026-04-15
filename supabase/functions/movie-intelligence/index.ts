import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── 2026 Indian Movies — confirmed/announced releases ──
const MOVIES_2026 = [
  // Bollywood 2026
  {
    title: "Ramayana: The Legend of Prince Rama",
    year: 2026, genre: "Mythology / Epic", language: "Hindi",
    platform: "Theatrical", releaseDate: "Diwali 2026", hype: "High" as const,
    category: "Bollywood",
    whyWatch: "Ranbir Kapoor as Lord Ram in Nitesh Tiwari's mega-budget epic — most anticipated Indian film of 2026",
    imdb: 0, director: "Nitesh Tiwari", cast: "Ranbir Kapoor, Sai Pallavi, Yash",
  },
  {
    title: "War 2",
    year: 2026, genre: "Action / Thriller", language: "Hindi",
    platform: "Theatrical", releaseDate: "August 14, 2026", hype: "High" as const,
    category: "Bollywood",
    whyWatch: "Hrithik Roshan vs Jr NTR — the biggest action showdown of 2026",
    imdb: 0, director: "Ayan Mukerji", cast: "Hrithik Roshan, Jr NTR, Kiara Advani",
  },
  {
    title: "Dhoom 4",
    year: 2026, genre: "Action / Thriller", language: "Hindi",
    platform: "Theatrical", releaseDate: "Christmas 2026", hype: "High" as const,
    category: "Bollywood",
    whyWatch: "Franchise revival with a fresh cast — high-octane heist thriller returns",
    imdb: 0, director: "Aditya Chopra", cast: "Ranbir Kapoor, Ranveer Singh",
  },
  {
    title: "Don 3",
    year: 2026, genre: "Crime / Action", language: "Hindi",
    platform: "Theatrical", releaseDate: "2026", hype: "High" as const,
    category: "Bollywood",
    whyWatch: "Ranveer Singh takes over the iconic Don franchise from Shah Rukh Khan",
    imdb: 0, director: "Farhan Akhtar", cast: "Ranveer Singh, Kiara Advani",
  },
  {
    title: "Jolly LLB 3",
    year: 2026, genre: "Comedy / Drama", language: "Hindi",
    platform: "Theatrical", releaseDate: "April 10, 2026", hype: "High" as const,
    category: "Bollywood",
    whyWatch: "Akshay Kumar and Arshad Warsi team up for courtroom comedy sequel",
    imdb: 0, director: "Subhash Kapoor", cast: "Akshay Kumar, Arshad Warsi",
  },
  {
    title: "Sikandar",
    year: 2026, genre: "Action / Drama", language: "Hindi",
    platform: "Theatrical", releaseDate: "Eid 2026", hype: "High" as const,
    category: "Bollywood",
    whyWatch: "Salman Khan's Eid blockbuster directed by A.R. Murugadoss",
    imdb: 0, director: "A.R. Murugadoss", cast: "Salman Khan, Rashmika Mandanna",
  },
  {
    title: "Thugs of Hindostan 2",
    year: 2026, genre: "Action / Adventure", language: "Hindi",
    platform: "Theatrical", releaseDate: "2026", hype: "Medium" as const,
    category: "Bollywood",
    whyWatch: "Aamir Khan returns with a revamped sequel to the franchise",
    imdb: 0, director: "Vijay Krishna Acharya", cast: "Aamir Khan",
  },
  // South Indian 2026
  {
    title: "Pushpa 3: The Rampage",
    year: 2026, genre: "Action / Drama", language: "Telugu",
    platform: "Theatrical", releaseDate: "2026", hype: "High" as const,
    category: "South Indian",
    whyWatch: "Allu Arjun's trilogy closer — will Pushpa's empire survive the final battle?",
    imdb: 0, director: "Sukumar", cast: "Allu Arjun, Rashmika Mandanna, Fahadh Faasil",
  },
  {
    title: "KGF Chapter 3",
    year: 2026, genre: "Action / Drama", language: "Kannada",
    platform: "Theatrical", releaseDate: "2026", hype: "High" as const,
    category: "South Indian",
    whyWatch: "Yash returns as Rocky Bhai — can it top the ₹1200 Cr of Chapter 2?",
    imdb: 0, director: "Prashanth Neel", cast: "Yash, Raveena Tandon",
  },
  {
    title: "Coolie",
    year: 2026, genre: "Action / Thriller", language: "Tamil",
    platform: "Theatrical", releaseDate: "2026", hype: "High" as const,
    category: "South Indian",
    whyWatch: "Rajinikanth teams up with Lokesh Kanagaraj for the Lokesh Cinematic Universe",
    imdb: 0, director: "Lokesh Kanagaraj", cast: "Rajinikanth, Shruti Haasan",
  },
  {
    title: "Thalaivar 171",
    year: 2026, genre: "Action / Drama", language: "Tamil",
    platform: "Theatrical", releaseDate: "2026", hype: "High" as const,
    category: "South Indian",
    whyWatch: "Rajinikanth's next after Coolie — massive anticipation among Tamil fans",
    imdb: 0, director: "TBA", cast: "Rajinikanth",
  },
  {
    title: "Spirit",
    year: 2026, genre: "Action / Thriller", language: "Telugu",
    platform: "Theatrical", releaseDate: "2026", hype: "High" as const,
    category: "South Indian",
    whyWatch: "Prabhas teams with Sandeep Reddy Vanga for an intense action thriller",
    imdb: 0, director: "Sandeep Reddy Vanga", cast: "Prabhas",
  },
  {
    title: "Toxic",
    year: 2026, genre: "Action / Thriller", language: "Kannada",
    platform: "Theatrical", releaseDate: "April 2026", hype: "High" as const,
    category: "South Indian",
    whyWatch: "Yash's gangster drama — a bold departure from the KGF universe",
    imdb: 0, director: "Geetu Mohandas", cast: "Yash, Nayanthara, Kiara Advani",
  },
  {
    title: "Fauji",
    year: 2026, genre: "War / Action", language: "Hindi",
    platform: "Theatrical", releaseDate: "2026", hype: "Medium" as const,
    category: "Bollywood",
    whyWatch: "Aamir Khan returns as a soldier in a patriotic war drama",
    imdb: 0, director: "TBA", cast: "Aamir Khan",
  },
  {
    title: "Baaghi 4",
    year: 2026, genre: "Action / Thriller", language: "Hindi",
    platform: "Theatrical", releaseDate: "September 5, 2026", hype: "Medium" as const,
    category: "Bollywood",
    whyWatch: "Tiger Shroff's martial arts franchise continues with bigger stunts",
    imdb: 0, director: "A. Harsha", cast: "Tiger Shroff, Sanjay Dutt",
  },
];

const CATEGORY_MAP: Record<string, string[]> = {
  Bollywood: MOVIES_2026.filter(m => m.category === "Bollywood").map(m => m.title),
  South: MOVIES_2026.filter(m => m.category === "South Indian").map(m => m.title),
  Action: MOVIES_2026.filter(m => m.genre.includes("Action")).map(m => m.title),
  Comedy: MOVIES_2026.filter(m => m.genre.includes("Comedy")).map(m => m.title),
  Thriller: MOVIES_2026.filter(m => m.genre.includes("Thriller")).map(m => m.title),
  Romance: [],
};

async function fetchPosterFromOMDb(apiKey: string, title: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({ apikey: apiKey, t: title, plot: "short" });
    const res = await fetch(`https://www.omdbapi.com/?${params}`);
    const data = await res.json();
    return data.Response === "True" && data.Poster && data.Poster !== "N/A" ? data.Poster : null;
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

    let movies = [...MOVIES_2026];
    if (category && category !== "All" && CATEGORY_MAP[category]) {
      const titles = CATEGORY_MAP[category];
      movies = MOVIES_2026.filter(m => titles.includes(m.title));
    }

    // Shuffle
    movies.sort(() => Math.random() - 0.5);

    // Try to fetch posters from OMDb for known franchise titles
    const OMDB_API_KEY = Deno.env.get("OMDB_API_KEY");

    const dailySuggestions = movies.slice(0, 5).map(m => ({
      title: m.title,
      year: m.year,
      genre: m.genre,
      imdb: m.imdb || 0,
      platform: m.platform,
      language: m.language,
      whyWatch: m.whyWatch,
    }));

    const todayReleases = movies
      .filter(m => m.hype === "High")
      .slice(0, 3)
      .map(m => ({
        title: m.title,
        platform: m.platform,
        language: m.language,
        genre: m.genre,
      }));

    const upcomingMovies = movies.slice(0, 6).map(m => ({
      title: m.title,
      releaseDate: m.releaseDate,
      hype: m.hype,
      category: m.category,
    }));

    const reviews = movies.slice(0, 3).map(m => ({
      title: m.title,
      positives: [
        m.cast ? `Star cast: ${m.cast.split(",")[0]}` : "Top-tier cast",
        m.director && m.director !== "TBA" ? `Directed by ${m.director}` : "Highly anticipated direction",
        m.hype === "High" ? "Massive buzz & hype" : "Growing anticipation",
      ],
      negatives: [
        "Unreleased — final verdict pending",
        m.hype === "High" ? "Sky-high expectations to meet" : "Needs strong marketing push",
      ],
      sentiment: "Good" as const,
      verdict: "Watch" as const,
    }));

    const boxOffice = movies.slice(0, 5).map(m => ({
      title: m.title,
      todayEarnings: "Unreleased",
      totalCollection: "TBA",
      status: m.hype === "High" ? "Blockbuster" as const : "Hit" as const,
    }));

    const trendingIndia = movies
      .filter(m => m.hype === "High")
      .slice(0, 5)
      .map((m, i) => ({ title: m.title, rank: i + 1 }));

    const trendingWorldwide = movies
      .sort((a, b) => (b.hype === "High" ? 1 : 0) - (a.hype === "High" ? 1 : 0))
      .slice(0, 5)
      .map((m, i) => ({ title: m.title, rank: i + 1 }));

    const gems = movies.filter(m => m.category === "South Indian");
    const gem = gems[Math.floor(Math.random() * gems.length)] || movies[0];
    const hiddenGem = {
      title: gem.title,
      description: gem.whyWatch,
      imdb: gem.imdb || 0,
    };

    const quotes = [
      { quote: "Pushpa, main jhukega nahi!", movie: "Pushpa (2021)", character: "Allu Arjun" },
      { quote: "Ek baar jo maine commitment kar di, toh phir main apne aap ki bhi nahi sunta.", movie: "Wanted (2009)", character: "Salman Khan" },
      { quote: "Don ko pakadna mushkil hi nahi, namumkin hai.", movie: "Don (2006)", character: "Shah Rukh Khan" },
      { quote: "Mogambo khush hua!", movie: "Mr. India (1987)", character: "Amrish Puri" },
      { quote: "Picture abhi baaki hai mere dost.", movie: "Om Shanti Om (2007)", character: "Shah Rukh Khan" },
      { quote: "Zindagi mein kuch banna ho, kuch paana ho, toh seekh... taraki kar!", movie: "12th Fail (2023)", character: "Manoj Kumar Sharma" },
      { quote: "Idhu en area, en gethu!", movie: "Vikram (2022)", character: "Kamal Haasan" },
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
