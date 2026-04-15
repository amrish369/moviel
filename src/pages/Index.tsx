import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Film, Clapperboard, Wifi, WifiOff, Loader2, Search, Star, X, Send } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
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
            <DailySuggestions movies={data.dailySuggestions} />
            <TodayReleases releases={data.todayReleases} />
            <UpcomingMovies movies={data.upcomingMovies} />
            <SmartReviews reviews={data.reviews} />
            <BoxOfficeSection data={data.boxOffice} />
            <TrendingSection worldwide={data.trendingWorldwide} india={data.trendingIndia} />
            <BonusSection hiddenGem={data.hiddenGem} quote={data.quoteOfTheDay} />
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
