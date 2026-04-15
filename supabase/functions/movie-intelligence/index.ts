import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Released Indian Movies (for Daily Suggestions, Reviews, Box Office) ──
const RELEASED_TITLES = [
  "Pushpa 2", "Stree 2", "Animal", "Jawan", "Pathaan", "Dunki",
  "Fighter", "Crew", "Bhool Bhulaiyaa 3", "Singham Again",
  "Salaar", "Kalki 2898 AD", "Devara", "Vidaamuyarchi",
  "Kantara", "RRR", "KGF Chapter 2", "Vikram", "Ponniyin Selvan",
  "Jailer", "Leo", "12th Fail", "Sam Bahadur", "Laapataa Ladies",
  "Shaitaan", "Article 370", "Manjummel Boys", "Aavesham",
  "Hanuman", "Gadar 2", "OMG 2", "Rocky Aur Rani Kii Prem Kahaani",
  "Tumbbad", "Drishyam 2", "Jai Bhim", "Maharaja", "Amaran",
];

const CATEGORY_MAP: Record<string, string[]> = {
  Bollywood: ["Animal", "Jawan", "Pathaan", "Dunki", "Fighter", "Crew", "Stree 2", "Bhool Bhulaiyaa 3", "Singham Again", "12th Fail", "Sam Bahadur", "Laapataa Ladies", "Shaitaan", "Article 370", "Gadar 2", "OMG 2", "Rocky Aur Rani Kii Prem Kahaani", "Drishyam 2"],
  South: ["Pushpa 2", "Salaar", "Kalki 2898 AD", "Devara", "RRR", "KGF Chapter 2", "Vikram", "Ponniyin Selvan", "Jailer", "Leo", "Kantara", "Manjummel Boys", "Aavesham", "Hanuman", "Vidaamuyarchi", "Tumbbad", "Jai Bhim", "Maharaja", "Amaran"],
  Action: ["Animal", "Jawan", "Pathaan", "Fighter", "Pushpa 2", "Salaar", "KGF Chapter 2", "Singham Again", "Devara", "Kalki 2898 AD", "RRR"],
  Comedy: ["Stree 2", "Crew", "Bhool Bhulaiyaa 3", "Laapataa Ladies", "OMG 2", "Aavesham", "Rocky Aur Rani Kii Prem Kahaani"],
  Thriller: ["Animal", "12th Fail", "Shaitaan", "Article 370", "Vikram", "Sam Bahadur", "Tumbbad", "Drishyam 2", "Maharaja"],
  Romance: ["Rocky Aur Rani Kii Prem Kahaani", "Dunki"],
};

// ── Upcoming 2026 Indian Movies ──
const UPCOMING_2026 = [
  { title: "Ramayana: The Legend of Prince Rama", releaseDate: "Diwali 2026", hype: "High", category: "Bollywood", cast: "Ranbir Kapoor, Sai Pallavi, Yash", director: "Nitesh Tiwari" },
  { title: "War 2", releaseDate: "August 14, 2026", hype: "High", category: "Bollywood", cast: "Hrithik Roshan, Jr NTR, Kiara Advani", director: "Ayan Mukerji" },
  { title: "Pushpa 3: The Rampage", releaseDate: "2026", hype: "High", category: "South Indian", cast: "Allu Arjun, Rashmika Mandanna, Fahadh Faasil", director: "Sukumar" },
  { title: "Dhoom 4", releaseDate: "Christmas 2026", hype: "High", category: "Bollywood", cast: "Ranbir Kapoor, Ranveer Singh", director: "Aditya Chopra" },
  { title: "KGF Chapter 3", releaseDate: "2026", hype: "High", category: "South Indian", cast: "Yash, Raveena Tandon", director: "Prashanth Neel" },
  { title: "Don 3", releaseDate: "2026", hype: "High", category: "Bollywood", cast: "Ranveer Singh, Kiara Advani", director: "Farhan Akhtar" },
  { title: "Sikandar", releaseDate: "Eid 2026", hype: "High", category: "Bollywood", cast: "Salman Khan, Rashmika Mandanna", director: "A.R. Murugadoss" },
  { title: "Coolie", releaseDate: "2026", hype: "High", category: "South Indian", cast: "Rajinikanth, Shruti Haasan", director: "Lokesh Kanagaraj" },
  { title: "Jolly LLB 3", releaseDate: "April 10, 2026", hype: "High", category: "Bollywood", cast: "Akshay Kumar, Arshad Warsi", director: "Subhash Kapoor" },
  { title: "Toxic", releaseDate: "April 2026", hype: "High", category: "South Indian", cast: "Yash, Nayanthara, Kiara Advani", director: "Geetu Mohandas" },
  { title: "Spirit", releaseDate: "2026", hype: "High", category: "South Indian", cast: "Prabhas", director: "Sandeep Reddy Vanga" },
  { title: "Baaghi 4", releaseDate: "September 5, 2026", hype: "Medium", category: "Bollywood", cast: "Tiger Shroff, Sanjay Dutt", director: "A. Harsha" },
];

// ── Actor Spotlight Data ──
const ACTOR_SPOTLIGHTS = [
  { name: "Allu Arjun", knownFor: "Pushpa franchise", upcomingCount: 1, image: "🌟", fact: "National Award winner for Pushpa: The Rise — first Telugu actor in 39 years" },
  { name: "Ranbir Kapoor", knownFor: "Animal, Brahmastra", upcomingCount: 2, image: "🎭", fact: "Starring in both Ramayana & Dhoom 4 in 2026 — his biggest year yet" },
  { name: "Rajinikanth", knownFor: "Jailer, Vikram", upcomingCount: 2, image: "👑", fact: "At 75, Thalaivar continues to dominate with Coolie in the LCU" },
  { name: "Shah Rukh Khan", knownFor: "Jawan, Pathaan", upcomingCount: 1, image: "🏆", fact: "Made the biggest comeback in Bollywood history with ₹3,000 Cr+ in 2023" },
  { name: "Yash", knownFor: "KGF franchise", upcomingCount: 2, image: "⚡", fact: "Yash returns with both KGF Chapter 3 and Toxic in 2026" },
  { name: "Hrithik Roshan", knownFor: "War, Fighter", upcomingCount: 1, image: "💪", fact: "War 2 pairs him with Jr NTR — two action superstars collide" },
  { name: "Prabhas", knownFor: "Baahubali, Kalki 2898 AD", upcomingCount: 1, image: "🔥", fact: "Spirit reunites him with Sandeep Reddy Vanga for a dark thriller" },
];

// ── OTT This Week ──
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

// ── This Day in Bollywood ──
function getThisDayFact(): { year: number; event: string; trivia: string } {
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

    // Select titles based on category
    let titles = RELEASED_TITLES;
    if (category && category !== "All" && CATEGORY_MAP[category]) {
      titles = CATEGORY_MAP[category];
    }

    // Shuffle and pick 15
    const shuffled = [...titles].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 15);

    // Fetch real data from OMDb
    const movies = await Promise.all(selected.map((t) => fetchFromOMDb(OMDB_API_KEY, t)));
    const valid = movies.filter(Boolean);

    // Daily Suggestions — RELEASED movies only
    const dailySuggestions = valid.slice(0, 5).map((m: any) => ({
      title: m.Title,
      year: parseInt(m.Year) || 2024,
      genre: m.Genre || "N/A",
      imdb: parseFloat(m.imdbRating) || 0,
      platform: m.Type === "series" ? "OTT" : "Theatrical",
      language: m.Language?.split(",")?.[0]?.trim() || "Hindi",
      whyWatch: m.Plot && m.Plot !== "N/A" ? m.Plot.substring(0, 120) : "A must-watch Indian film",
    }));

    // Today's OTT Releases
    const todayReleases = valid.slice(5, 8).map((m: any) => ({
      title: m.Title,
      platform: m.Type === "series" ? "OTT" : "Theatrical",
      language: m.Language?.split(",")?.[0]?.trim() || "Hindi",
      genre: m.Genre || "N/A",
    }));

    // Upcoming 2026 movies
    const upcomingMovies = UPCOMING_2026.slice(0, 6).map((m) => ({
      title: m.title,
      releaseDate: m.releaseDate,
      hype: m.hype,
      category: m.category,
    }));

    // Reviews from real OMDb data
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

    // Box Office from real data
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

    // Trending
    const trendingIndia = valid.slice(0, 5).map((m: any, i: number) => ({
      title: m.Title, rank: i + 1,
    }));
    const trendingWorldwide = valid.slice(2, 7).map((m: any, i: number) => ({
      title: m.Title, rank: i + 1,
    }));

    // Hidden Gem
    const gem = valid.find((m: any) => {
      const r = parseFloat(m.imdbRating) || 0;
      const votes = parseInt(m.imdbVotes?.replace(/,/g, "")) || 0;
      return r >= 7 && votes < 300000;
    }) || valid[valid.length - 1];

    const hiddenGem = gem
      ? { title: gem.Title, description: gem.Plot || "An underrated Indian gem worth watching", imdb: parseFloat(gem.imdbRating) || 7.0 }
      : { title: "Tumbbad", description: "A visual masterpiece blending mythology and horror — one of India's finest films ever made", imdb: 8.3 };

    // Quotes
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

    // Actor Spotlight — pick 3 random
    const spotlightShuffled = [...ACTOR_SPOTLIGHTS].sort(() => Math.random() - 0.5);
    const actorSpotlight = spotlightShuffled.slice(0, 3);

    // OTT This Week — pick 5
    const ottThisWeek = OTT_RELEASES.slice(0, 5);

    // This Day in Bollywood
    const thisDayInBollywood = getThisDayFact();

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
      actorSpotlight,
      ottThisWeek,
      thisDayInBollywood,
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
