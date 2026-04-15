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
    title: "Ramayana: The Legend of Prince Rama",
    year: 2026, genre: "Mythology / Epic", imdb: 0,
    platform: "Theatrical", language: "Hindi",
    whyWatch: "Ranbir Kapoor as Lord Ram in Nitesh Tiwari's mega-budget epic — most anticipated Indian film of 2026",
  },
  {
    title: "War 2",
    year: 2026, genre: "Action / Thriller", imdb: 0,
    platform: "Theatrical", language: "Hindi",
    whyWatch: "Hrithik Roshan vs Jr NTR — the biggest action showdown of 2026",
  },
  {
    title: "Pushpa 3: The Rampage",
    year: 2026, genre: "Action / Drama", imdb: 0,
    platform: "Theatrical", language: "Telugu",
    whyWatch: "Allu Arjun's trilogy closer — will Pushpa's empire survive the final battle?",
  },
  {
    title: "Coolie",
    year: 2026, genre: "Action / Thriller", imdb: 0,
    platform: "Theatrical", language: "Tamil",
    whyWatch: "Rajinikanth teams up with Lokesh Kanagaraj for the Lokesh Cinematic Universe",
  },
  {
    title: "Sikandar",
    year: 2026, genre: "Action / Drama", imdb: 0,
    platform: "Theatrical", language: "Hindi",
    whyWatch: "Salman Khan's Eid blockbuster directed by A.R. Murugadoss",
  },
];

export const todayReleases: Release[] = [
  { title: "Jolly LLB 3", platform: "Theatrical", language: "Hindi", genre: "Comedy / Drama" },
  { title: "Toxic", platform: "Theatrical", language: "Kannada", genre: "Action / Thriller" },
  { title: "KGF Chapter 3", platform: "Theatrical", language: "Kannada", genre: "Action / Drama" },
];

export const upcomingMovies: Upcoming[] = [
  { title: "Ramayana: The Legend of Prince Rama", releaseDate: "Diwali 2026", hype: "High", category: "Bollywood" },
  { title: "War 2", releaseDate: "August 14, 2026", hype: "High", category: "Bollywood" },
  { title: "Pushpa 3: The Rampage", releaseDate: "2026", hype: "High", category: "South Indian" },
  { title: "Dhoom 4", releaseDate: "Christmas 2026", hype: "High", category: "Bollywood" },
  { title: "KGF Chapter 3", releaseDate: "2026", hype: "High", category: "South Indian" },
  { title: "Don 3", releaseDate: "2026", hype: "High", category: "Bollywood" },
];

export const reviews: Review[] = [
  {
    title: "Ramayana: The Legend of Prince Rama",
    positives: ["Ranbir Kapoor as Lord Ram", "Nitesh Tiwari directing", "Massive VFX budget"],
    negatives: ["Unreleased — final verdict pending", "Sky-high expectations"],
    sentiment: "Good",
    verdict: "Watch",
  },
  {
    title: "War 2",
    positives: ["Hrithik vs Jr NTR face-off", "Ayan Mukerji's direction", "Massive buzz & hype"],
    negatives: ["Unreleased — final verdict pending", "Living up to War 1's standard"],
    sentiment: "Good",
    verdict: "Watch",
  },
  {
    title: "Coolie",
    positives: ["Rajinikanth x Lokesh Kanagaraj", "Part of LCU", "Growing anticipation"],
    negatives: ["Unreleased — final verdict pending", "High expectations to meet"],
    sentiment: "Good",
    verdict: "Watch",
  },
];

export const boxOffice: BoxOffice[] = [
  { title: "Ramayana: The Legend of Prince Rama", todayEarnings: "Unreleased", totalCollection: "TBA", status: "Blockbuster" },
  { title: "War 2", todayEarnings: "Unreleased", totalCollection: "TBA", status: "Blockbuster" },
  { title: "Pushpa 3: The Rampage", todayEarnings: "Unreleased", totalCollection: "TBA", status: "Blockbuster" },
  { title: "KGF Chapter 3", todayEarnings: "Unreleased", totalCollection: "TBA", status: "Blockbuster" },
  { title: "Sikandar", todayEarnings: "Unreleased", totalCollection: "TBA", status: "Hit" },
];

export const trendingWorldwide: TrendingItem[] = [
  { title: "Ramayana: The Legend of Prince Rama", rank: 1 },
  { title: "War 2", rank: 2 },
  { title: "Pushpa 3: The Rampage", rank: 3 },
  { title: "KGF Chapter 3", rank: 4 },
  { title: "Coolie", rank: 5 },
];

export const trendingIndia: TrendingItem[] = [
  { title: "Ramayana: The Legend of Prince Rama", rank: 1 },
  { title: "Sikandar", rank: 2 },
  { title: "War 2", rank: 3 },
  { title: "Jolly LLB 3", rank: 4 },
  { title: "Dhoom 4", rank: 5 },
];

export const hiddenGem = {
  title: "Toxic (2026)",
  description: "Yash's gangster drama — a bold departure from the KGF universe with Nayanthara and Kiara Advani. Available Theatrically.",
  imdb: 0,
};

export const quoteOfTheDay = {
  quote: "Pushpa, main jhukega nahi!",
  movie: "Pushpa: The Rise (2021)",
  character: "Allu Arjun",
};

export type Mood = "Action" | "Romance" | "Thriller" | "Comedy" | "Emotional" | "Mixed";
export type Category = "Bollywood" | "Hollywood" | "South" | "Web Series" | "Anime" | "All";
export type Platform = "Netflix" | "Prime" | "Hotstar" | "Theatrical" | "All";
