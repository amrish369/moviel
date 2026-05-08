import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CastMember {
  name: string;
  character: string;
  photoQuery?: string;
}

export interface MovieDetail {
  title: string;
  year: number;
  genre: string;
  imdb: number;
  runtime?: string;
  certification?: string;
  language: string;
  country?: string;
  tagline?: string;
  plot?: string;
  director?: { name: string; knownFor?: string[] };
  writers?: { name: string; role?: string }[];
  cast?: CastMember[];
  producers?: string[];
  music?: string;
  cinematography?: string;
  platform?: string;
  boxOffice?: {
    budget?: string;
    openingDay?: string;
    totalIndia?: string;
    totalWorldwide?: string;
    verdict?: string;
  };
  ratings?: {
    imdb?: number;
    rottenTomatoes?: string;
    audienceScore?: string;
  };
  trailerQuery?: string;
  youtubeKey?: string | null;
  videoType?: string | null;
  similarMovies?: {
    title: string;
    year: number;
    imdb: number;
    genre: string;
    whyWatch?: string;
  }[];
}

// Generate a basic fallback movie detail from just the title
function createFallbackDetail(title: string): MovieDetail {
  return {
    title,
    year: new Date().getFullYear(),
    genre: "Unknown",
    imdb: 0,
    language: "Unknown",
    plot: "Movie details are temporarily unavailable. Please try again later.",
  };
}

export function useMovieDetail() {
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async (title: string) => {
    setIsLoading(true);
    setError(null);
    setMovie(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("movie-detail", {
        body: { title },
      });

      if (fnError) throw fnError;

      // Handle fallback signal from edge function (credits exhausted / rate limited)
      if (data?.fallback) {
        setError(data.message || "AI service temporarily unavailable");
        setMovie(createFallbackDetail(title));
        return;
      }

      if (data?.error && !data?.fallback) throw new Error(data.error);

      setMovie(data);
    } catch (err) {
      console.error("Failed to fetch movie detail:", err);
      setError(err instanceof Error ? err.message : "Failed to load movie details");
      // Still show a basic page instead of blank screen
      setMovie(createFallbackDetail(title));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { movie, isLoading, error, fetchDetail };
}
