import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Movie, Release, Upcoming, Review, BoxOffice, TrendingItem } from "@/data/movieData";
import {
  dailySuggestions as fallbackSuggestions,
  todayReleases as fallbackReleases,
  upcomingMovies as fallbackUpcoming,
  reviews as fallbackReviews,
  boxOffice as fallbackBoxOffice,
  trendingWorldwide as fallbackWorldwide,
  trendingIndia as fallbackIndia,
  hiddenGem as fallbackGem,
  quoteOfTheDay as fallbackQuote,
} from "@/data/movieData";

export interface MovieDashboard {
  dailySuggestions: Movie[];
  todayReleases: Release[];
  upcomingMovies: Upcoming[];
  reviews: Review[];
  boxOffice: BoxOffice[];
  trendingWorldwide: TrendingItem[];
  trendingIndia: TrendingItem[];
  hiddenGem: { title: string; description: string; imdb: number };
  quoteOfTheDay: { quote: string; movie: string; character: string };
}

const fallbackData: MovieDashboard = {
  dailySuggestions: fallbackSuggestions,
  todayReleases: fallbackReleases,
  upcomingMovies: fallbackUpcoming,
  reviews: fallbackReviews,
  boxOffice: fallbackBoxOffice,
  trendingWorldwide: fallbackWorldwide,
  trendingIndia: fallbackIndia,
  hiddenGem: fallbackGem,
  quoteOfTheDay: fallbackQuote,
};

export function useMovieIntelligence() {
  const [data, setData] = useState<MovieDashboard>(fallbackData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  const fetchMovies = useCallback(async (mood?: string, category?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("movie-intelligence", {
        body: { mood, category },
      });

      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);

      setData({
        dailySuggestions: result.dailySuggestions || fallbackData.dailySuggestions,
        todayReleases: result.todayReleases || fallbackData.todayReleases,
        upcomingMovies: result.upcomingMovies || fallbackData.upcomingMovies,
        reviews: result.reviews || fallbackData.reviews,
        boxOffice: result.boxOffice || fallbackData.boxOffice,
        trendingWorldwide: result.trendingWorldwide || fallbackData.trendingWorldwide,
        trendingIndia: result.trendingIndia || fallbackData.trendingIndia,
        hiddenGem: result.hiddenGem || fallbackData.hiddenGem,
        quoteOfTheDay: result.quoteOfTheDay || fallbackData.quoteOfTheDay,
      });
      setIsLive(true);
    } catch (err) {
      console.error("Failed to fetch AI movie data:", err);
      setError(err instanceof Error ? err.message : "Failed to load live data");
      setData(fallbackData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, isLive, fetchMovies };
}
