import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Movie, Release, Upcoming, Review, BoxOffice, TrendingItem, ActorSpotlight, OttRelease, ThisDayFact } from "@/data/movieData";
import { validateDashboardData } from "@/lib/movieValidation";
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
  actorSpotlight as fallbackSpotlight,
  ottThisWeek as fallbackOtt,
  thisDayInBollywood as fallbackThisDay,
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
  actorSpotlight: ActorSpotlight[];
  ottThisWeek: OttRelease[];
  thisDayInBollywood: ThisDayFact;
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
  actorSpotlight: fallbackSpotlight,
  ottThisWeek: fallbackOtt,
  thisDayInBollywood: fallbackThisDay,
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

      const validated = validateDashboardData(result);

      setData({
        dailySuggestions: validated.dailySuggestions?.length ? validated.dailySuggestions : fallbackData.dailySuggestions,
        todayReleases: validated.todayReleases?.length ? validated.todayReleases : fallbackData.todayReleases,
        upcomingMovies: validated.upcomingMovies?.length ? validated.upcomingMovies : fallbackData.upcomingMovies,
        reviews: validated.reviews?.length ? validated.reviews : fallbackData.reviews,
        boxOffice: validated.boxOffice?.length ? validated.boxOffice : fallbackData.boxOffice,
        trendingWorldwide: validated.trendingWorldwide?.length ? validated.trendingWorldwide : fallbackData.trendingWorldwide,
        trendingIndia: validated.trendingIndia?.length ? validated.trendingIndia : fallbackData.trendingIndia,
        hiddenGem: validated.hiddenGem || fallbackData.hiddenGem,
        quoteOfTheDay: validated.quoteOfTheDay || fallbackData.quoteOfTheDay,
        actorSpotlight: result.actorSpotlight?.length ? result.actorSpotlight : fallbackData.actorSpotlight,
        ottThisWeek: result.ottThisWeek?.length ? result.ottThisWeek : fallbackData.ottThisWeek,
        thisDayInBollywood: result.thisDayInBollywood || fallbackData.thisDayInBollywood,
      });
      setIsLive(true);
    } catch (err) {
      console.error("Failed to fetch movie data:", err);
      setError(err instanceof Error ? err.message : "Failed to load live data");
      setData(fallbackData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, isLive, fetchMovies };
}
