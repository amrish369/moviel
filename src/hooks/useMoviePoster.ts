import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const posterCache = new Map<string, string>();

export const useMoviePoster = (title: string, year?: string, genre?: string) => {
  const [posterUrl, setPosterUrl] = useState<string | null>(posterCache.get(title) || null);
  const [isLoading, setIsLoading] = useState(!posterCache.has(title));

  useEffect(() => {
    if (!title || posterCache.has(title)) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const fetchPoster = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("movie-poster", {
          body: { title, year, genre },
        });
        if (cancelled) return;
        if (error) throw error;
        if (data?.imageUrl) {
          posterCache.set(title, data.imageUrl);
          setPosterUrl(data.imageUrl);
        }
      } catch (e) {
        console.error("Poster fetch error:", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchPoster();
    return () => { cancelled = true; };
  }, [title, year, genre]);

  return { posterUrl, isLoading };
};
