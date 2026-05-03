import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Star, Heart, Send, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getViewedIds, getInterests, markViewed, trackClick,
  toggleLike, getLikes, useDwellTime, trackScrollTime, useStableCallback,
} from "@/hooks/useFeedTracking";

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

const FeedCard = ({ item }: { item: FeedItem }) => {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [liked, setLiked] = useState(() => getLikes().includes(item.id));

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
            onClick={(e) => { e.stopPropagation(); setLiked(toggleLike(item)); }}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-colors ${
              liked ? "bg-cinema-red/20 text-cinema-red" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Like"
          >
            <Heart className={`w-3 h-3 ${liked ? "fill-cinema-red" : ""}`} />
            {liked ? "Liked" : "Like"}
          </button>
          <a
            href="https://t.me/cineradarai"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[hsl(200,80%,50%)]/15 text-[hsl(200,80%,50%)] hover:bg-[hsl(200,80%,50%)]/25 transition-colors"
          >
            <Send className="w-3 h-3" /> Download
          </a>
          <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
            {item.popularity > 100 ? "Trending" : "For You"}
          </span>
        </div>
      </div>
    </article>
  );
};

const InfiniteFeed = () => {
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
    try {
      const excludeIds = Array.from(new Set([...getViewedIds(), ...Array.from(seenRef.current)]));
      const interests = getInterests();
      const { data, error: fnErr } = await supabase.functions.invoke("feed", {
        body: { page, excludeIds, interests },
      });
      if (fnErr) throw fnErr;
      const incoming: FeedItem[] = (data?.items || []).filter((m: FeedItem) => !seenRef.current.has(m.id));
      incoming.forEach((m) => seenRef.current.add(m.id));
      setItems((prev) => [...prev, ...incoming]);
      setHasMore(Boolean(data?.hasMore) && incoming.length > 0 && page < 15);
      setPage((p) => p + 1);
    } catch (e: any) {
      setError(e?.message || "Could not load more");
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page]);

  // initial load
  useEffect(() => { loadMore(); /* eslint-disable-next-line */ }, []);

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

      <div className="grid gap-4">
        {items.map((it) => <FeedCard key={it.id} item={it} />)}
      </div>

      <div ref={sentinelRef} className="py-6 flex items-center justify-center">
        {loading && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
        {!loading && !hasMore && items.length > 0 && (
          <p className="text-xs text-muted-foreground">You're all caught up — fresh picks tomorrow ✨</p>
        )}
        {error && !loading && (
          <button onClick={loadMore} className="text-xs text-primary underline">Retry</button>
        )}
      </div>
    </section>
  );
};

export default InfiniteFeed;