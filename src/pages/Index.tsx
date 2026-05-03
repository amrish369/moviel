import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Film, Clapperboard, Wifi, WifiOff, Loader2, Search, Star, X, Send, Menu, Sparkles, Tv, CalendarDays, History, Rocket, CalendarRange, Users, MessageSquare, TrendingUp, Globe2, Gem, Infinity as InfinityIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import MoviePoster from "@/components/MoviePoster";
import FilterBar from "@/components/FilterBar";
import DailySuggestions from "@/components/DailySuggestions";
import TodayReleases from "@/components/TodayReleases";
import UpcomingMovies from "@/components/UpcomingMovies";
import SmartReviews from "@/components/SmartReviews";
import BoxOfficeSection from "@/components/BoxOfficeSection";
import TrendingSection from "@/components/TrendingSection";
import BonusSection from "@/components/BonusSection";
import ActorSpotlightSection from "@/components/ActorSpotlight";
import OttThisWeek from "@/components/OttThisWeek";
import ThisDayInBollywood from "@/components/ThisDayInBollywood";
import MonthlyCalendar from "@/components/MonthlyCalendar";
import InfiniteFeed from "@/components/InfiniteFeed";
import { useMovieIntelligence } from "@/hooks/useMovieIntelligence";
import { useMovieSearch, SearchResult } from "@/hooks/useMovieSearch";

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
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border">
              {movie.platform}
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
          <a
            href="https://t.me/cineradarai"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="ml-auto flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-[hsl(200,80%,50%)]/15 text-[hsl(200,80%,50%)] hover:bg-[hsl(200,80%,50%)]/25 transition-colors"
          >
            <Send className="w-3 h-3" />
            Download
          </a>
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
  const [searchQuery, setSearchQuery] = useState("");
  const [mood, setMood] = useState("Mixed");
  const [category, setCategory] = useState("All");
  const { data, isLoading, error, isLive, fetchMovies } = useMovieIntelligence();
  const { results, isSearching, searchError, searchMovies, clearSearch } = useMovieSearch();

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

  const sections = [
    { id: "for-you-feed", label: "For You (Infinite)", icon: InfinityIcon },
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Film className="w-3 h-3" />
              <span>{today}</span>
            </div>
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
              <InfiniteFeed />
            )}
            {activeSection === "daily-suggestions" && (
              <section id="daily-suggestions" className="scroll-mt-24"><DailySuggestions movies={data.dailySuggestions} monthLabel={data.currentMonth} /></section>
            )}
            {activeSection === "ott-this-week" && (
              <section id="ott-this-week" className="scroll-mt-24"><OttThisWeek releases={data.ottThisWeek} /></section>
            )}
            {activeSection === "today-releases" && (
              <section id="today-releases" className="scroll-mt-24"><TodayReleases releases={data.todayReleases} /></section>
            )}
            {activeSection === "this-day-bollywood" && (
              <section id="this-day-bollywood" className="scroll-mt-24"><ThisDayInBollywood fact={data.thisDayInBollywood} /></section>
            )}
            {activeSection === "upcoming-movies" && (
              <section id="upcoming-movies" className="scroll-mt-24"><UpcomingMovies movies={data.upcomingMovies} monthLabel={data.nextMonth} /></section>
            )}
            {activeSection === "monthly-calendar" && (
              <section id="monthly-calendar" className="scroll-mt-24"><MonthlyCalendar /></section>
            )}
            {activeSection === "actor-spotlight" && (
              <section id="actor-spotlight" className="scroll-mt-24"><ActorSpotlightSection actors={data.actorSpotlight} /></section>
            )}
            {activeSection === "smart-reviews" && (
              <section id="smart-reviews" className="scroll-mt-24"><SmartReviews reviews={data.reviews} /></section>
            )}
            {activeSection === "box-office" && (
              <section id="box-office" className="scroll-mt-24"><BoxOfficeSection data={data.boxOffice} /></section>
            )}
            {activeSection === "trending" && (
              <section id="trending" className="scroll-mt-24"><TrendingSection worldwide={data.trendingWorldwide} india={data.trendingIndia} /></section>
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
