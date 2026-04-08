import { useState } from "react";
import { Film, Clapperboard } from "lucide-react";
import FilterBar from "@/components/FilterBar";
import DailySuggestions from "@/components/DailySuggestions";
import TodayReleases from "@/components/TodayReleases";
import UpcomingMovies from "@/components/UpcomingMovies";
import SmartReviews from "@/components/SmartReviews";
import BoxOfficeSection from "@/components/BoxOfficeSection";
import TrendingSection from "@/components/TrendingSection";
import BonusSection from "@/components/BonusSection";
import {
  dailySuggestions,
  todayReleases,
  upcomingMovies,
  reviews,
  boxOffice,
  trendingWorldwide,
  trendingIndia,
  hiddenGem,
  quoteOfTheDay,
} from "@/data/movieData";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setMood] = useState("Mixed");
  const [, setCategory] = useState("All");

  const searchResult = searchQuery
    ? dailySuggestions.find((m) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

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
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Film className="w-3 h-3" />
            <span>April 8, 2026</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-10">
        <FilterBar
          onSearch={setSearchQuery}
          onMoodChange={setMood}
          onCategoryChange={setCategory}
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
        <DailySuggestions movies={dailySuggestions} />
        <TodayReleases releases={todayReleases} />
        <UpcomingMovies movies={upcomingMovies} />
        <SmartReviews reviews={reviews} />
        <BoxOfficeSection data={boxOffice} />
        <TrendingSection worldwide={trendingWorldwide} india={trendingIndia} />
        <BonusSection hiddenGem={hiddenGem} quote={quoteOfTheDay} />

        {/* Footer */}
        <footer className="text-center py-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            CineRadar • AI Movie Intelligence Engine • Data sourced from public records
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
