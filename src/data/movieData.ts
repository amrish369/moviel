export type Movie = {
  title: string;
  year: number;
  genre: string;
  imdb: number;
  platform: string;
  language: string;
  whyWatch?: string;
  category?: string;
};

export type Release = {
  title: string;
  platform: string;
  language: string;
  genre: string;
};

export type Upcoming = {
  title: string;
  releaseDate: string;
  hype: "Low" | "Medium" | "High";
  category: string;
};

export type Review = {
  title: string;
  positives: string[];
  negatives: string[];
  sentiment: "Good" | "Average" | "Poor";
  verdict: "Watch" | "Skip" | "OTT Wait";
};

export type BoxOffice = {
  title: string;
  todayEarnings: string;
  totalCollection: string;
  status: "Blockbuster" | "Hit" | "Average" | "Flop";
};

export type TrendingItem = {
  title: string;
  rank: number;
};

export const dailySuggestions: Movie[] = [
  {
    title: "Dhurandhar: The Revenge",
    year: 2026,
    genre: "Action / Spy Thriller",
    imdb: 8.1,
    platform: "Theatrical",
    language: "Hindi",
    whyWatch: "₹1000 Cr+ club — Ranveer Singh's career-best spy actioner still dominating screens",
  },
  {
    title: "The Boys Season 5",
    year: 2026,
    genre: "Superhero / Dark Comedy",
    imdb: 8.7,
    platform: "Prime Video",
    language: "English",
    whyWatch: "Final season just dropped — Billy Butcher's last war against Homelander",
  },
  {
    title: "The Raja Saab",
    year: 2026,
    genre: "Horror / Romance",
    imdb: 7.4,
    platform: "Theatrical",
    language: "Telugu",
    whyWatch: "Prabhas in a fresh genre-bending horror romance with massive buzz",
  },
  {
    title: "Toaster",
    year: 2026,
    genre: "Comedy / Drama",
    imdb: 7.2,
    platform: "Netflix",
    language: "Hindi",
    whyWatch: "Rajkummar Rao's quirky comedy premiering April 15 — trailer trending",
  },
  {
    title: "Beef Season 2",
    year: 2026,
    genre: "Dark Comedy / Drama",
    imdb: 8.0,
    platform: "Netflix",
    language: "English",
    whyWatch: "Critically acclaimed series returns with new cast and twisted storylines",
  },
];

export const todayReleases: Release[] = [
  { title: "Tu Yaa Main", platform: "OTT", language: "Hindi", genre: "Romance / Drama" },
  { title: "O'Romeo", platform: "OTT", language: "Hindi", genre: "Comedy" },
  { title: "The Boys S5", platform: "Prime Video", language: "English", genre: "Action / Superhero" },
];

export const upcomingMovies: Upcoming[] = [
  { title: "Bhooth Bangla", releaseDate: "Apr 11, 2026", hype: "High", category: "Bollywood" },
  { title: "Ramayana", releaseDate: "Apr 18, 2026", hype: "High", category: "Bollywood" },
  { title: "Toaster", releaseDate: "Apr 15, 2026", hype: "Medium", category: "Bollywood (Netflix)" },
  { title: "Dacoit", releaseDate: "Apr 11, 2026", hype: "Medium", category: "Bollywood" },
  { title: "Patriot", releaseDate: "Apr 18, 2026", hype: "Medium", category: "Bollywood" },
  { title: "MaatruBhumi", releaseDate: "Apr 11, 2026", hype: "Low", category: "Bollywood" },
];

export const reviews: Review[] = [
  {
    title: "Dhurandhar: The Revenge",
    positives: ["Ranveer's intense performance", "Slick action choreography", "Tight screenplay"],
    negatives: ["Second half slightly stretched", "Predictable climax"],
    sentiment: "Good",
    verdict: "Watch",
  },
  {
    title: "The Raja Saab",
    positives: ["Prabhas in a unique avatar", "Stunning visuals", "Good comedy timing"],
    negatives: ["Runtime could be shorter", "Horror elements feel tame"],
    sentiment: "Average",
    verdict: "Watch",
  },
  {
    title: "The Boys S5 (Episodes 1-3)",
    positives: ["Darkest season yet", "Karl Urban delivers", "High-stakes storytelling"],
    negatives: ["Slow start for some viewers", "Too many side plots"],
    sentiment: "Good",
    verdict: "Watch",
  },
];

export const boxOffice: BoxOffice[] = [
  { title: "Dhurandhar: The Revenge", todayEarnings: "₹18.5 Cr", totalCollection: "₹1,050 Cr (India)", status: "Blockbuster" },
  { title: "The Raja Saab", todayEarnings: "₹8.2 Cr", totalCollection: "₹185 Cr", status: "Hit" },
  { title: "Peddi", todayEarnings: "₹2.1 Cr", totalCollection: "₹42 Cr", status: "Average" },
  { title: "Snow White (Hollywood)", todayEarnings: "$4.2M", totalCollection: "$180M WW", status: "Average" },
  { title: "A Minecraft Movie", todayEarnings: "$3.8M", totalCollection: "$520M WW", status: "Hit" },
];

export const trendingWorldwide: TrendingItem[] = [
  { title: "The Boys S5", rank: 1 },
  { title: "Dhurandhar: The Revenge", rank: 2 },
  { title: "Beef S2", rank: 3 },
  { title: "A Minecraft Movie", rank: 4 },
  { title: "Ramayana (Trailer)", rank: 5 },
];

export const trendingIndia: TrendingItem[] = [
  { title: "Dhurandhar: The Revenge", rank: 1 },
  { title: "Ramayana Trailer", rank: 2 },
  { title: "Bhooth Bangla", rank: 3 },
  { title: "The Boys S5", rank: 4 },
  { title: "Toaster", rank: 5 },
];

export const hiddenGem = {
  title: "Agni (2024)",
  description: "An underrated Hindi film about firefighters battling corruption — emotionally gripping with stellar performances. Available on Prime Video.",
  imdb: 7.6,
};

export const quoteOfTheDay = {
  quote: "Danger ke saamne jhukna nahi, danger ko jhukana hai.",
  movie: "Dhurandhar: The Revenge (2026)",
  character: "Ranveer Singh",
};

export type Mood = "Action" | "Romance" | "Thriller" | "Comedy" | "Emotional" | "Mixed";
export type Category = "Bollywood" | "Hollywood" | "South" | "Web Series" | "Anime" | "All";
export type Platform = "Netflix" | "Prime" | "Hotstar" | "Theatrical" | "All";
