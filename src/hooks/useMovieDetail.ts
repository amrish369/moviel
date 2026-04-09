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
  similarMovies?: {
    title: string;
    year: number;
    imdb: number;
    genre: string;
    whyWatch?: string;
  }[];
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
      if (data?.error) throw new Error(data.error);

      setMovie(data);
    } catch (err) {
      console.error("Failed to fetch movie detail:", err);
      setError(err instanceof Error ? err.message : "Failed to load movie details");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { movie, isLoading, error, fetchDetail };
}
