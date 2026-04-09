import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  title: string;
  year: number;
  genre: string;
  imdb: number;
  platform: string;
  language: string;
  director?: string;
  cast?: string[];
  plot?: string;
  verdict?: string;
  whyWatch?: string;
}

export function useMovieSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchMovies = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const { data, error } = await supabase.functions.invoke("movie-search", {
        body: { query: query.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResults(data?.results || []);
    } catch (err) {
      console.error("Search failed:", err);
      setSearchError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setResults([]);
    setSearchError(null);
  }, []);

  return { results, isSearching, searchError, searchMovies, clearSearch };
}
