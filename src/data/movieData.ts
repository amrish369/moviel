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

export type ActorSpotlight = {
  name: string;
  knownFor: string;
  upcomingCount: number;
  image: string;
  fact: string;
};

export type OttRelease = {
  title: string;
  platform: string;
  language: string;
  date: string;
};

export type ThisDayFact = {
  year: number;
  event: string;
  trivia: string;
};

export const dailySuggestions: Movie[] = [
  { title: "Pushpa 2: The Rule", year: 2024, genre: "Action / Drama", imdb: 6.3, platform: "Theatrical", language: "Telugu", whyWatch: "Allu Arjun's blockbuster sequel — record-breaking box office in India" },
  { title: "Stree 2", year: 2024, genre: "Horror / Comedy", imdb: 7.1, platform: "OTT", language: "Hindi", whyWatch: "India's highest-grossing horror comedy — Rajkummar Rao at his best" },
  { title: "Kalki 2898 AD", year: 2024, genre: "Sci-Fi / Action", imdb: 6.3, platform: "OTT", language: "Telugu", whyWatch: "Prabhas in a futuristic Indian mythology epic with stunning VFX" },
  { title: "12th Fail", year: 2023, genre: "Drama / Biography", imdb: 8.6, platform: "OTT", language: "Hindi", whyWatch: "One of the highest-rated Indian films ever — an inspiring true story" },
  { title: "Laapataa Ladies", year: 2024, genre: "Comedy / Drama", imdb: 8.2, platform: "OTT", language: "Hindi", whyWatch: "Kiran Rao's heartwarming comedy — India's Oscar entry for 2025" },
];

export const todayReleases: Release[] = [
  { title: "Bhool Bhulaiyaa 3", platform: "OTT", language: "Hindi", genre: "Horror / Comedy" },
  { title: "Singham Again", platform: "OTT", language: "Hindi", genre: "Action / Drama" },
  { title: "Manjummel Boys", platform: "OTT", language: "Malayalam", genre: "Thriller / Adventure" },
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
  { title: "Pushpa 2: The Rule", positives: ["Allu Arjun's mass appeal", "High-octane action sequences", "Iconic dialogues"], negatives: ["Lengthy runtime", "Predictable storyline"], sentiment: "Good", verdict: "Watch" },
  { title: "Stree 2", positives: ["Perfect comedy timing", "Great ensemble cast", "Fresh horror elements"], negatives: ["Slightly slow mid-section", "Less scary than expected"], sentiment: "Good", verdict: "Watch" },
  { title: "12th Fail", positives: ["Vikrant Massey's career-best", "Emotionally gripping", "Realistic storytelling"], negatives: ["Slow burn pacing", "Limited action"], sentiment: "Good", verdict: "Watch" },
];

export const boxOffice: BoxOffice[] = [
  { title: "Pushpa 2: The Rule", todayEarnings: "₹15.2 Cr", totalCollection: "₹1,831 Cr (WW)", status: "Blockbuster" },
  { title: "Stree 2", todayEarnings: "₹5.8 Cr", totalCollection: "₹857 Cr (WW)", status: "Blockbuster" },
  { title: "Kalki 2898 AD", todayEarnings: "₹4.1 Cr", totalCollection: "₹1,055 Cr (WW)", status: "Blockbuster" },
  { title: "Jawan", todayEarnings: "₹3.2 Cr", totalCollection: "₹1,148 Cr (WW)", status: "Blockbuster" },
  { title: "Animal", todayEarnings: "₹2.5 Cr", totalCollection: "₹917 Cr (WW)", status: "Blockbuster" },
];

export const trendingWorldwide: TrendingItem[] = [
  { title: "Pushpa 2: The Rule", rank: 1 },
  { title: "Stree 2", rank: 2 },
  { title: "Kalki 2898 AD", rank: 3 },
  { title: "Jawan", rank: 4 },
  { title: "RRR", rank: 5 },
];

export const trendingIndia: TrendingItem[] = [
  { title: "Pushpa 2: The Rule", rank: 1 },
  { title: "Stree 2", rank: 2 },
  { title: "Bhool Bhulaiyaa 3", rank: 3 },
  { title: "Singham Again", rank: 4 },
  { title: "12th Fail", rank: 5 },
];

export const hiddenGem = {
  title: "Tumbbad (2018)",
  description: "A visual masterpiece blending mythology and horror — one of India's finest films ever made. Available on OTT.",
  imdb: 8.3,
};

export const quoteOfTheDay = {
  quote: "Pushpa, main jhukega nahi!",
  movie: "Pushpa: The Rise (2021)",
  character: "Allu Arjun",
};

export const actorSpotlight: ActorSpotlight[] = [
  { name: "Allu Arjun", knownFor: "Pushpa franchise", upcomingCount: 1, image: "🌟", fact: "National Award winner for Pushpa: The Rise" },
  { name: "Ranbir Kapoor", knownFor: "Animal, Brahmastra", upcomingCount: 2, image: "🎭", fact: "Starring in Ramayana & Dhoom 4 in 2026" },
  { name: "Rajinikanth", knownFor: "Jailer, Vikram", upcomingCount: 2, image: "👑", fact: "Thalaivar continues to dominate with Coolie" },
];

export const ottThisWeek: OttRelease[] = [
  { title: "Pushpa 2: The Rule", platform: "Netflix", language: "Telugu/Hindi", date: "Streaming Now" },
  { title: "Stree 2", platform: "Prime Video", language: "Hindi", date: "Streaming Now" },
  { title: "Kalki 2898 AD", platform: "Netflix", language: "Telugu/Hindi", date: "Streaming Now" },
  { title: "Manjummel Boys", platform: "Hotstar", language: "Malayalam", date: "Streaming Now" },
  { title: "Laapataa Ladies", platform: "Netflix", language: "Hindi", date: "Streaming Now" },
];

export const thisDayInBollywood: ThisDayFact = {
  year: 2022,
  event: "RRR took the global box office by storm",
  trivia: "Naatu Naatu won the Oscar for Best Original Song — a first for India",
};

export type Mood = "Action" | "Romance" | "Thriller" | "Comedy" | "Emotional" | "Mixed";
export type Category = "Bollywood" | "Hollywood" | "South" | "Web Series" | "Anime" | "All";
export type Platform = "Netflix" | "Prime" | "Hotstar" | "Theatrical" | "All";
