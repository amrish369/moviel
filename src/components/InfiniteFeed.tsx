import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Star, Heart, Sparkles, Bookmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getViewedIds, getInterests, markViewed, trackClick,
  useDwellTime, trackScrollTime, useStableCallback,
} from "@/hooks/useFeedTracking";
import { useUserLibrary } from "@/hooks/useUserLibrary";
import DownloadButton from "./DownloadButton";
import PlayOnTelegram from "./PlayOnTelegram";

interface FeedItem {
  id: number;
  title: string;
  year: number | null;
  overview: string;
  poster: string | null;
  backdrop: string | null;
  rating: number;
  language: string;
  langCode: string;
  genreIds: number[];
  popularity: number;
  releaseDate: string | null;
}

const FeedCard = ({ item, liked, saved, onLike, onSave }: {
  item: FeedItem; liked: boolean; saved: boolean;
  onLike: (i: FeedItem) => void; onSave: (i: FeedItem) => void;
}) => {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  const onDwell = useStableCallback((ms: number) => {
    if (ms >= 1500) markViewed(item.id, item);
    trackScrollTime(item, ms);
  });
  useDwellTime(ref, onDwell);

  const open = () => {
    trackClick(item);
    navigate(`/movie?title=${encodeURIComponent(item.title)}`);
  };

  return (
    <article
      ref={ref}
      onClick={open}
      className="glass-card rounded-xl overflow-hidden cursor-pointer hover:border-primary/40 transition-all active:scale-[0.99]"
    >
      {item.backdrop && (
        <div className="relative aspect-video bg-secondary/40">
          <img
            src={item.backdrop}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold text-foreground truncate">{item.title}</h3>
              <p className="text-[11px] text-muted-foreground">
                {item.year || "—"} • {item.language}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0 bg-background/70 backdrop-blur px-2 py-0.5 rounded-full">
              <Star className="w-3 h-3 text-primary fill-primary" />
              <span className="text-xs font-bold text-primary">{item.rating || "—"}</span>
            </div>
          </div>
        </div>
      )}
      <div className="p-4 space-y-3">
        {item.overview && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{item.overview}</p>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onLike(item); }}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-colors ${
              liked ? "bg-cinema-red/20 text-cinema-red" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Like"
          >
            <Heart className={`w-3 h-3 ${liked ? "fill-cinema-red" : ""}`} />
            {liked ? "Liked" : "Like"}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSave(item); }}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-colors ${
              saved ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Watch later"
          >
            <Bookmark className={`w-3 h-3 ${saved ? "fill-primary" : ""}`} />
            {saved ? "Saved" : "Save"}
          </button>
          <DownloadButton movieTitle={item.title} />
          <PlayOnTelegram tmdbId={item.id} title={item.title} />
          <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
            {item.popularity > 100 ? "Trending" : "For You"}
          </span>
        </div>
      </div>
    </article>
  );
};

const InfiniteFeed = ({ mood, category }: { mood?: string; category?: string }) => {
  const { likes, watchlist, toggleLike, toggleWatchlist } = useUserLibrary();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const seenRef = useRef<Set<number>>(new Set());

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true); setError(null);
    const traceId = Math.random().toString(36).slice(2, 8);
    const tStart = performance.now();
    try {
      const interests = getInterests();
      let attempt = 0;
      let cursor = page;
      let collected: FeedItem[] = [];
      let serverHasMore = true;
      let totalRaw = 0;
      let lastServerMetrics: any = null;
      while (attempt < 5 && collected.length === 0 && cursor < 5000) {
        const viewedExcl = Array.from(new Set(getViewedIds())).slice(0, 150);
        const sessionExcl = Array.from(seenRef.current).slice(-300);
        const excludeIds = Array.from(new Set([...viewedExcl, ...sessionExcl])).slice(0, 500);
        const { data, error: fnErr } = await supabase.functions.invoke("feed", {
          body: { page: cursor, excludeIds, interests, mood, category, reqId: traceId },
        });
        if (fnErr) throw fnErr;
        serverHasMore = data?.hasMore !== false;
        const raw: FeedItem[] = data?.items || [];
        lastServerMetrics = data?.metrics || null;
        totalRaw += raw.length;
        for (const m of raw) {
          if (!m || seenRef.current.has(m.id)) continue;
          seenRef.current.add(m.id);
          collected.push(m);
        }
        cursor += 1;
        attempt += 1;
      }
      if (collected.length > 0) setItems((prev) => [...prev, ...collected]);
      setHasMore(serverHasMore && cursor < 5000);
      setPage(cursor);
      const dup = totalRaw - collected.length;
      console.log("[InfiniteFeed]", JSON.stringify({
        traceId, mood, category,
        startPage: page, endPage: cursor, attempts: attempt,
        rawTotal: totalRaw, newAdded: collected.length,
        dupDropped: dup, dupRatio: totalRaw ? +(dup / totalRaw).toFixed(2) : 0,
        seenAfter: seenRef.current.size,
        hasMore: serverHasMore && cursor < 5000,
        ms: Math.round(performance.now() - tStart),
        serverMetrics: lastServerMetrics,
      }));
    } catch (e: any) {
      setError(e?.message || "Could not load more");
      setHasMore(true);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, mood, category]);

  useEffect(() => {
    seenRef.current = new Set();
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, [mood, category]);

  useEffect(() => {
    if (items.length === 0 && hasMore && !loading) loadMore();
  }, [items.length, hasMore, loading, loadMore]);

  // Intersection Observer for infinite scroll (preloads ~5 ahead via rootMargin)
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore();
    }, { rootMargin: "1200px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  return (
    <section id="for-you-feed" className="space-y-4 scroll-mt-24">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="font-display text-lg font-bold text-gradient-gold">For You</h2>
        <span className="text-[10px] text-muted-foreground ml-1">Personalized • Refreshed daily</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <FeedCard
            key={it.id}
            item={it}
            liked={likes.includes(it.id)}
            saved={watchlist.includes(it.id)}
            onLike={toggleLike}
            onSave={toggleWatchlist}
          />
        ))}
      </div>

      <div ref={sentinelRef} className="py-6 flex items-center justify-center">
        {loading && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
        {!loading && hasMore && items.length > 0 && (
          <p className="text-[11px] text-muted-foreground">Scroll for more…</p>
        )}
        {error && !loading && (
          <button onClick={loadMore} className="text-xs text-primary underline">Retry</button>
        )}
      </div>
    </section>
  );
};

export default InfiniteFeed;