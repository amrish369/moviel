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
  mediaType?: "movie" | "tv";
  poster?: string | null;
}

export function useMovieSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchMovies = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setSuggestions([]);
      setDidYouMean(null);
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
      setSuggestions(data?.suggestions || []);
      setDidYouMean(data?.didYouMean || null);
    } catch (err) {
      console.error("Search failed:", err);
      setSearchError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
      setSuggestions([]);
      setDidYouMean(null);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setResults([]);
    setSuggestions([]);
    setDidYouMean(null);
    setSearchError(null);
  }, []);

  return { results, suggestions, didYouMean, isSearching, searchError, searchMovies, clearSearch };
}
