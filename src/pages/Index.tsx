import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clapperboard, Wifi, WifiOff, Loader2, Search, Star, X, Menu, Sparkles, Tv, CalendarDays, History, Rocket, CalendarRange, Users, MessageSquare, TrendingUp, Globe2, Gem, Infinity as InfinityIcon, Bookmark, LogIn, User as UserIcon, Play, MonitorPlay, Music as MusicIcon, GraduationCap } from "lucide-react";
import DownloadButton from "@/components/DownloadButton";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import MoviePoster from "@/components/MoviePoster";
import FilterBar from "@/components/FilterBar";
import BonusSection from "@/components/BonusSection";
import InfiniteSection from "@/components/InfiniteSection";
import ActorSpotlightSection from "@/components/ActorSpotlight";
import ThisDayInBollywood from "@/components/ThisDayInBollywood";
import MonthlyCalendar from "@/components/MonthlyCalendar";
import InfiniteFeed from "@/components/InfiniteFeed";
import TrailerReels from "@/components/TrailerReels";
import WebSeriesSection from "@/components/WebSeriesSection";
import { useMovieIntelligence } from "@/hooks/useMovieIntelligence";
import { useMovieSearch, SearchResult } from "@/hooks/useMovieSearch";
import { usePerfTracking } from "@/hooks/usePerfTracking";

const SearchResultCard = ({ movie, onClick }: { movie: SearchResult; onClick: () => void }) => (
  <div
    onClick={onClick}
    className="glass-card rounded-lg p-4 cursor-pointer hover:border-primary/30 transition-all active:scale-[0.98]"
  >
    <div className="flex items-start gap-3">
      <MoviePoster title={movie.title} year={movie.year} genre={movie.genre} size="sm" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-bold text-foreground hover:text-primary transition-colors">{movie.title}</h3>
            <p className="text-xs text-muted-foreground">
              {movie.year} • {movie.genre} • {movie.language}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-3.5 h-3.5 text-primary fill-primary" />
            <span className="text-sm font-bold text-primary">{movie.imdb}</span>
          </div>
        </div>
        {movie.director && (
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground/70 font-medium">Director:</span> {movie.director}
          </p>
        )}
        {movie.cast && movie.cast.length > 0 && (
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground/70 font-medium">Cast:</span> {movie.cast.join(", ")}
          </p>
        )}
        {movie.plot && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{movie.plot}</p>
        )}
        <div className="flex items-center gap-3 pt-1">
          {movie.platform && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
              movie.mediaType === "tv"
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-secondary text-secondary-foreground border-border"
            }`}>
              {movie.mediaType === "tv" ? "📺 Web Series" : movie.platform}
            </span>
          )}
          {movie.verdict && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              movie.verdict === "Watch" ? "bg-cinema-green/20 text-cinema-green" :
              movie.verdict === "Skip" ? "bg-cinema-red/20 text-cinema-red" :
              "bg-primary/20 text-primary"
            }`}>
              {movie.verdict}
            </span>
          )}
          <DownloadButton movieTitle={movie.title} className="ml-auto" />
        </div>
        {movie.whyWatch && (
          <p className="text-xs text-primary/80 italic">💡 {movie.whyWatch}</p>
        )}
      </div>
    </div>
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  usePerfTracking("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [mood, setMood] = useState("Mixed");
  const [category, setCategory] = useState("All");
  const { data, isLoading, error, isLive, fetchMovies } = useMovieIntelligence();
  const { results, suggestions, didYouMean, isSearching, searchError, searchMovies, clearSearch } = useMovieSearch();

  useEffect(() => {
    fetchMovies(mood, category);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length >= 2) {
      searchMovies(query);
    } else {
      clearSearch();
    }
  };

  const applySuggestion = (s: string) => {
    setSearchQuery(s);
    searchMovies(s);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    clearSearch();
  };

  const handleMoodChange = (newMood: string) => {
    setMood(newMood);
    fetchMovies(newMood, category);
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    fetchMovies(mood, newCategory);
  };

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const showSearchResults = searchQuery.trim().length >= 2;
  const [activeSection, setActiveSection] = useState<string>("for-you-feed");

  // Dynamic SEO based on active section
  useEffect(() => {
    const map: Record<string, { t: string; d: string }> = {
      "for-you-feed": { t: "CineRadar — Personalized Bollywood, South & OTT Movies 2026", d: "AI-powered movie recommendations: latest Hindi, Tamil, Telugu, Malayalam & OTT releases updated daily." },
      "today-releases": { t: "Today's Movie Releases — Bollywood, South & OTT | CineRadar", d: "All movies releasing today across Bollywood, South Indian cinema and OTT platforms." },
      "ott-this-week": { t: "OTT Releases This Week — Netflix, Prime, Hotstar | CineRadar", d: "Latest OTT movie & web series releases this week on Netflix, Prime Video, Hotstar and more." },
      "upcoming-movies": { t: "Upcoming Bollywood & South Indian Movies 2026 | CineRadar", d: "Upcoming Hindi, Tamil, Telugu, Malayalam movie releases in 2026 with dates and cast." },
      "box-office": { t: "Box Office Collection 2026 — Daily Updates | CineRadar", d: "Live Bollywood and South box office collection reports and lifetime numbers." },
      "trending": { t: "Trending Movies India & Worldwide 2026 | CineRadar", d: "Most trending Indian and global movies right now, ranked by popularity." },
      "monthly-calendar": { t: "Movie Release Calendar 2026 | CineRadar", d: "Monthly release calendar for all Indian and international movies in 2026." },
    };
    const meta = map[activeSection] || map["for-you-feed"];
    document.title = meta.t;
    let desc = document.querySelector('meta[name="description"]');
    if (!desc) { desc = document.createElement("meta"); desc.setAttribute("name", "description"); document.head.appendChild(desc); }
    desc.setAttribute("content", meta.d);
  }, [activeSection]);

  const sections = [
    { id: "for-you-feed", label: "For You (Infinite)", icon: InfinityIcon },
    { id: "trailer-reels", label: "Trailer Reels 🎬", icon: Play },
    { id: "web-series", label: "Web Series", icon: MonitorPlay },
    { id: "daily-suggestions", label: "Daily Suggestions", icon: Sparkles },
    { id: "ott-this-week", label: "OTT This Week", icon: Tv },
    { id: "today-releases", label: "Today's Releases", icon: CalendarDays },
    { id: "this-day-bollywood", label: "This Day in Bollywood", icon: History },
    { id: "upcoming-movies", label: "Upcoming Movies", icon: Rocket },
    { id: "monthly-calendar", label: "Monthly Calendar", icon: CalendarRange },
    { id: "actor-spotlight", label: "Actor Spotlight", icon: Users },
    { id: "smart-reviews", label: "Smart Reviews", icon: MessageSquare },
    { id: "box-office", label: "Box Office", icon: TrendingUp },
    { id: "trending", label: "Trending", icon: Globe2 },
    { id: "bonus", label: "Hidden Gem & Quote", icon: Gem },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  aria-label="Open menu"
                  className="w-9 h-9 rounded-lg bg-secondary/60 hover:bg-secondary flex items-center justify-center transition-colors"
                >
                  <Menu className="w-5 h-5 text-foreground" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
                <SheetHeader className="p-4 border-b border-border">
                  <SheetTitle className="text-gradient-gold font-display">Sections</SheetTitle>
                </SheetHeader>
                <nav className="flex-1 overflow-y-auto p-2">
                  <SheetClose asChild>
                    <Link
                      to="/study"
                      className="w-full flex items-center gap-3 px-3 py-2.5 mb-1 rounded-md text-sm text-foreground hover:bg-secondary/70 hover:text-primary transition-colors"
                    >
                      <GraduationCap className="w-4 h-4 text-primary/70" />
                      <span>Study Hub (BCA)</span>
                    </Link>
                  </SheetClose>
                  {sections.map((s) => (
                    <SheetClose asChild key={s.id}>
                      <button
                        onClick={() => {
                          if (showSearchResults) handleClearSearch();
                          scrollToSection(s.id);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-left ${
                          activeSection === s.id
                            ? "bg-primary/15 text-primary border border-primary/30 font-semibold"
                            : "text-foreground hover:bg-secondary/70 hover:text-primary"
                        }`}
                      >
                        <s.icon className={`w-4 h-4 ${activeSection === s.id ? "text-primary" : "text-primary/70"}`} />
                        <span>{s.label}</span>
                        {activeSection === s.id && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </button>
                    </SheetClose>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center glow-gold">
              <Clapperboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-gradient-gold leading-tight">CineRadar</h1>
              <p className="text-[10px] text-muted-foreground">AI Movie Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {isLive ? (
                <Wifi className="w-3 h-3 text-cinema-green" />
              ) : (
                <WifiOff className="w-3 h-3 text-muted-foreground" />
              )}
              <span className={`text-[10px] font-medium ${isLive ? "text-cinema-green" : "text-muted-foreground"}`}>
                {isLive ? "LIVE" : "OFFLINE"}
              </span>
            </div>
            <Link to="/watchlist" aria-label="Watchlist" className="w-8 h-8 rounded-lg bg-secondary/60 hover:bg-secondary flex items-center justify-center">
              <Bookmark className="w-4 h-4 text-primary" />
            </Link>
            <Link to="/music" aria-label="Music" className="w-8 h-8 rounded-lg bg-secondary/60 hover:bg-secondary flex items-center justify-center">
              <MusicIcon className="w-4 h-4 text-primary" />
            </Link>
            <Link to="/study" aria-label="Study Hub" className="w-8 h-8 rounded-lg bg-secondary/60 hover:bg-secondary flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary" />
            </Link>
            {user ? (
              <Link to="/dashboard" aria-label="Dashboard" className="w-8 h-8 rounded-lg bg-primary/15 hover:bg-primary/25 flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-primary" />
              </Link>
            ) : (
              <Link to="/auth" aria-label="Sign in" className="flex items-center gap-1 px-2.5 h-8 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary text-xs font-semibold">
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign in</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm flex items-center justify-center">
          <div className="glass-card rounded-xl p-6 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-foreground font-medium">Generating AI Intelligence...</p>
            <p className="text-xs text-muted-foreground">Analyzing trends & ratings</p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="bg-cinema-red/10 border border-cinema-red/30 rounded-lg p-3 text-sm text-cinema-red">
            ⚠️ {error} — Showing cached data
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-10">
        <FilterBar
          onSearch={handleSearch}
          onMoodChange={handleMoodChange}
          onCategoryChange={handleCategoryChange}
          mood={mood}
          category={category}
        />

        {/* Search Results Mode */}
        {showSearchResults && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                <h2 className="font-display text-lg font-bold text-foreground">
                  Results for "{searchQuery}"
                </h2>
              </div>
              <button
                onClick={handleClearSearch}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-secondary"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            </div>

            {isSearching && (
              <div className="glass-card rounded-lg p-8 flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Searching for "{searchQuery}"...</p>
              </div>
            )}

            {searchError && (
              <div className="bg-cinema-red/10 border border-cinema-red/30 rounded-lg p-3 text-sm text-cinema-red">
                ⚠️ {searchError}
              </div>
            )}

            {!isSearching && didYouMean && (
              <div className="text-xs text-muted-foreground">
                Did you mean{" "}
                <button
                  onClick={() => applySuggestion(didYouMean)}
                  className="text-primary underline font-medium"
                >
                  {didYouMean}
                </button>
                ?
              </div>
            )}

            {!isSearching && !searchError && suggestions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground mr-1">Try:</span>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => applySuggestion(s)}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-secondary/70 text-foreground hover:bg-primary/20 hover:text-primary transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {!isSearching && !searchError && results.length > 0 && (
              <div className="space-y-3">
                {results.map((movie, i) => (
                  <SearchResultCard key={`${movie.title}-${i}`} movie={movie} onClick={() => navigate(`/movie?title=${encodeURIComponent(movie.title)}`)} />
                ))}
              </div>
            )}

            {!isSearching && !searchError && results.length === 0 && (
              <div className="glass-card rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground">No results found. Try a different search term.</p>
              </div>
            )}
          </section>
        )}

        {/* Full Dashboard */}
        {!showSearchResults && (
          <>
            {activeSection === "for-you-feed" && (
              <InfiniteFeed mood={mood} category={category} />
            )}
            {activeSection === "trailer-reels" && (
              <section id="trailer-reels"><TrailerReels mood={mood} category={category} /></section>
            )}
            {activeSection === "web-series" && (
              <section id="web-series" className="scroll-mt-24"><WebSeriesSection mood={mood} category={category} /></section>
            )}
            {activeSection === "daily-suggestions" && (
              <div id="daily-suggestions">
                <InfiniteSection section="daily" mood={mood} category={category}
                  icon="🎬" title="Daily Movie Suggestions"
                  subtitle="Top picks personalised to your mood & category" />
              </div>
            )}
            {activeSection === "ott-this-week" && (
              <div id="ott-this-week">
                <InfiniteSection section="ott" mood={mood} category={category}
                  icon="📺" title="OTT This Week"
                  subtitle="Now streaming — keeps loading as you scroll" />
              </div>
            )}
            {activeSection === "today-releases" && (
              <div id="today-releases">
                <InfiniteSection section="today" mood={mood} category={category}
                  icon="🆕" title="Today's Releases" subtitle="Latest drops this week" />
              </div>
            )}
            {activeSection === "this-day-bollywood" && (
              <section id="this-day-bollywood" className="scroll-mt-24"><ThisDayInBollywood fact={data.thisDayInBollywood} /></section>
            )}
            {activeSection === "upcoming-movies" && (
              <div id="upcoming-movies">
                <InfiniteSection section="upcoming" mood={mood} category={category}
                  icon="📅" title="Upcoming Movies" subtitle="Releases coming up — keep scrolling" />
              </div>
            )}
            {activeSection === "monthly-calendar" && (
              <section id="monthly-calendar" className="scroll-mt-24"><MonthlyCalendar /></section>
            )}
            {activeSection === "actor-spotlight" && (
              <section id="actor-spotlight" className="scroll-mt-24"><ActorSpotlightSection actors={data.actorSpotlight} /></section>
            )}
            {activeSection === "smart-reviews" && (
              <div id="smart-reviews">
                <InfiniteSection section="reviews" mood={mood} category={category}
                  icon="⭐" title="Smart Reviews" subtitle="Verdicts on the latest releases" />
              </div>
            )}
            {activeSection === "box-office" && (
              <div id="box-office">
                <InfiniteSection section="boxoffice" mood={mood} category={category}
                  icon="💰" title="Box Office Collection" subtitle="Top earners — scrolling pulls more" />
              </div>
            )}
            {activeSection === "trending" && (
              <div id="trending" className="space-y-8">
                <InfiniteSection section="trending-india" mood={mood} category={category}
                  icon="🔥" title="Trending in India" subtitle="Hot right now" />
                <InfiniteSection section="trending-worldwide" mood={mood} category={category}
                  icon="🌍" title="Trending Worldwide" subtitle="Global pop charts" />
              </div>
            )}
            {activeSection === "bonus" && (
              <section id="bonus" className="scroll-mt-24"><BonusSection hiddenGem={data.hiddenGem} quote={data.quoteOfTheDay} /></section>
            )}
          </>
        )}

        {/* Footer */}
        <footer className="text-center py-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            CineRadar • AI Movie Intelligence Engine • {isLive ? "Powered by Lovable AI" : "Data sourced from public records"}
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
