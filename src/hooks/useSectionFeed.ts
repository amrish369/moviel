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
      // Walk forward through pages until we get NEW unique items (or hit retry cap).
      let attempt = 0;
      let cursor = page;
      let collected: SectionItem[] = [];
      let serverHasMore = true;
      while (attempt < 5 && collected.length === 0 && cursor < 5000) {
        const excludeIds = Array.from(seen.current).slice(-400);
        const { data, error: fnErr } = await supabase.functions.invoke("section-feed", {
          body: { section, page: cursor, mood, category, excludeIds },
        });
        if (myId !== reqId.current) return; // stale
        if (fnErr) throw fnErr;
        serverHasMore = data?.hasMore !== false;
        const raw: SectionItem[] = data?.items || [];
        for (const it of raw) {
          if (!it || seen.current.has(it.id)) continue;
          seen.current.add(it.id);
          collected.push(it);
        }
        cursor += 1;
        attempt += 1;
      }
      if (collected.length > 0) setItems((prev) => [...prev, ...collected]);
      setHasMore(serverHasMore && cursor < 5000);
      setPage(cursor);
    } catch (e: any) {
      if (myId !== reqId.current) return;
      setError(e?.message || "Failed to load");
      setHasMore(true);
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