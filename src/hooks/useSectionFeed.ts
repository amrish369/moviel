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
    const traceId = Math.random().toString(36).slice(2, 8);
    const tStart = performance.now();
    try {
      // Walk forward through pages until we get NEW unique items (or hit retry cap).
      let attempt = 0;
      let cursor = page;
      let collected: SectionItem[] = [];
      let serverHasMore = true;
      let totalRaw = 0;
      let totalDup = 0;
      let lastServerMetrics: any = null;
      while (attempt < 5 && collected.length === 0 && cursor < 5000) {
        const excludeIds = Array.from(seen.current).slice(-400);
        const { data, error: fnErr } = await supabase.functions.invoke("section-feed", {
          body: { section, page: cursor, mood, category, excludeIds, reqId: traceId },
        });
        if (myId !== reqId.current) return; // stale
        if (fnErr) throw fnErr;
        serverHasMore = data?.hasMore !== false;
        const raw: SectionItem[] = data?.items || [];
        lastServerMetrics = data?.metrics || null;
        totalRaw += raw.length;
        let dupThisPage = 0;
        for (const it of raw) {
          if (!it || seen.current.has(it.id)) continue;
          seen.current.add(it.id);
          collected.push(it);
        }
        dupThisPage = raw.length - collected.length + (collected.length === 0 ? 0 : 0);
        // Recompute dup precisely (raw - newly added during this iteration)
        totalDup = totalRaw - collected.length;
        cursor += 1;
        attempt += 1;
      }
      if (collected.length > 0) setItems((prev) => [...prev, ...collected]);
      setHasMore(serverHasMore && cursor < 5000);
      setPage(cursor);
      console.log("[useSectionFeed]", JSON.stringify({
        traceId, section, mood, category,
        startPage: page, endPage: cursor,
        attempts: attempt, excludeSent: Math.min(seen.current.size, 400),
        rawTotal: totalRaw, newAdded: collected.length, dupDropped: totalDup,
        dupRatio: totalRaw ? +(totalDup / totalRaw).toFixed(2) : 0,
        seenAfter: seen.current.size, hasMore: serverHasMore && cursor < 5000,
        ms: Math.round(performance.now() - tStart),
        serverMetrics: lastServerMetrics,
      }));
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