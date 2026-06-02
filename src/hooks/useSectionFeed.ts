import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SectionItem {
  id: number;
  title: string;
  year?: number | null;
  releaseDateRaw?: string | null;
  overview?: string;
  poster?: string | null;
  backdrop?: string | null;
  rating?: number;
  voteCount?: number;
  popularity?: number;
  language?: string;
  langCode?: string;
  category?: string;
  genreIds?: number[];
  revenue?: number;
  firstAirDate?: string | null;
}

export function useSectionFeed(section: string, mood?: string, category?: string) {
  const [items, setItems] = useState<SectionItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const seen = useRef<Set<number>>(new Set());
  const reqId = useRef(0);

  const reset = useCallback(() => {
    seen.current = new Set();
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  // Reset whenever section/mood/category changes
  useEffect(() => { reset(); }, [section, mood, category, reset]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);
    const myId = ++reqId.current;
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("section-feed", {
        body: { section, page, mood, category },
      });
      if (myId !== reqId.current) return; // stale
      if (fnErr) throw fnErr;
      const incoming: SectionItem[] = (data?.items || []).filter((i: SectionItem) => {
        if (seen.current.has(i.id)) return false;
        seen.current.add(i.id);
        return true;
      });
      setItems((prev) => [...prev, ...incoming]);
      setHasMore(Boolean(data?.hasMore) && page < 50);
      setPage((p) => p + 1);
    } catch (e: any) {
      if (myId !== reqId.current) return;
      setError(e?.message || "Failed to load");
      setHasMore(false);
    } finally {
      if (myId === reqId.current) setLoading(false);
    }
  }, [section, mood, category, page, loading, hasMore]);

  // initial / filter-change load
  useEffect(() => {
    if (items.length === 0 && hasMore && !loading) loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, mood, category, items.length]);

  // intersection observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore();
    }, { rootMargin: "800px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  return { items, loading, hasMore, error, sentinelRef, loadMore, reset };
}