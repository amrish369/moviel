import { useState, useEffect } from "react";
import { Film, Clapperboard, Wifi, WifiOff, Loader2 } from "lucide-react";
import FilterBar from "@/components/FilterBar";
import DailySuggestions from "@/components/DailySuggestions";
import TodayReleases from "@/components/TodayReleases";
import UpcomingMovies from "@/components/UpcomingMovies";
import SmartReviews from "@/components/SmartReviews";
import BoxOfficeSection from "@/components/BoxOfficeSection";
import TrendingSection from "@/components/TrendingSection";
import BonusSection from "@/components/BonusSection";
import { useMovieIntelligence } from "@/hooks/useMovieIntelligence";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [mood, setMood] = useState("Mixed");
  const [category, setCategory] = useState("All");
  const { data, isLoading, error, isLive, fetchMovies } = useMovieIntelligence();

  useEffect(() => {
    fetchMovies(mood, category);
  }, []);

  const handleMoodChange = (newMood: string) => {
    setMood(newMood);
    fetchMovies(newMood, category);
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    fetchMovies(mood, newCategory);
  };

  const searchResult = searchQuery
    ? data.dailySuggestions.find((m) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

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
          onSearch={setSearchQuery}
          onMoodChange={handleMoodChange}
          onCategoryChange={handleCategoryChange}
        />

        {/* Search Result Mode */}
        {searchQuery && (
          <section className="glass-card rounded-lg p-5">
            <h2 className="font-display text-lg font-bold text-foreground mb-3">
              🔍 Search: "{searchQuery}"
            </h2>
            {searchResult ? (
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Title:</span> <span className="text-foreground font-medium">{searchResult.title}</span></p>
                <p><span className="text-muted-foreground">Year:</span> {searchResult.year}</p>
                <p><span className="text-muted-foreground">Genre:</span> {searchResult.genre}</p>
                <p><span className="text-muted-foreground">IMDb:</span> <span className="text-primary font-bold">{searchResult.imdb}</span></p>
                <p><span className="text-muted-foreground">Platform:</span> {searchResult.platform}</p>
                <p><span className="text-muted-foreground">Summary:</span> {searchResult.whyWatch}</p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Data not available for this query. Showing full dashboard below.</p>
            )}
          </section>
        )}

        {/* Full Dashboard */}
        <DailySuggestions movies={data.dailySuggestions} />
        <TodayReleases releases={data.todayReleases} />
        <UpcomingMovies movies={data.upcomingMovies} />
        <SmartReviews reviews={data.reviews} />
        <BoxOfficeSection data={data.boxOffice} />
        <TrendingSection worldwide={data.trendingWorldwide} india={data.trendingIndia} />
        <BonusSection hiddenGem={data.hiddenGem} quote={data.quoteOfTheDay} />

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
