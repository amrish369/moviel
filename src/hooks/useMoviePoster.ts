import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const posterCache = new Map<string, string>();
const failedTitles = new Set<string>(); // Don't retry failed titles

export const useMoviePoster = (title: string, year?: string | number, genre?: string) => {
  const [posterUrl, setPosterUrl] = useState<string | null>(posterCache.get(title) || null);
  const [isLoading, setIsLoading] = useState(!posterCache.has(title) && !failedTitles.has(title));

  useEffect(() => {
    if (!title || posterCache.has(title) || failedTitles.has(title)) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const fetchPoster = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("movie-poster", {
          body: { title: title.trim(), year, genre },
        });
        if (cancelled) return;
        if (error) throw error;
        if (data?.error) {
          // Mark as failed so we don't retry (credits exhausted, etc.)
          failedTitles.add(title);
          throw new Error(data.error);
        }
        if (data?.imageUrl) {
          posterCache.set(title, data.imageUrl);
          setPosterUrl(data.imageUrl);
        } else {
          failedTitles.add(title);
        }
      } catch (e) {
        if (!cancelled) failedTitles.add(title);
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
