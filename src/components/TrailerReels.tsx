import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, Play, Volume2, VolumeX, Star, Bookmark, Heart, Info, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useUserLibrary } from "@/hooks/useUserLibrary";

type Trailer = {
  id: number;
  title: string;
  year: number | null;
  overview: string;
  poster: string | null;
  backdrop: string | null;
  rating: number;
  language: string;
  youtubeKey: string;
  videoName: string;
};

const ReelCard = ({ trailer, active, muted, onToggleMute }: {
  trailer: Trailer; active: boolean; muted: boolean; onToggleMute: () => void;
}) => {
  const navigate = useNavigate();
  const { likes, watchlist, toggleLike, toggleWatchlist } = useUserLibrary();
  const liked = likes.includes(trailer.id);
  const saved = watchlist.includes(trailer.id);
  const item = { id: trailer.id, title: trailer.title, poster: trailer.poster, year: trailer.year };

  const src = active
    ? `https://www.youtube.com/embed/${trailer.youtubeKey}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${trailer.youtubeKey}`
    : "";

  return (
    <div className="relative h-[100svh] w-full snap-start snap-always bg-black overflow-hidden flex items-center justify-center">
      {/* Backdrop blur fallback */}
      {trailer.backdrop && (
        <img
          src={trailer.backdrop}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-40 scale-110 blur-xl"
        />
      )}

      {/* Video */}
      {active ? (
        <iframe
          key={trailer.youtubeKey + (muted ? "m" : "u")}
          src={src}
          title={trailer.title}
          allow="autoplay; encrypted-media; picture-in-picture"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ aspectRatio: "16/9" }}
        />
      ) : (
        trailer.poster && (
          <img src={trailer.poster} alt={trailer.title} className="max-h-full max-w-full object-contain" />
        )
      )}

      {/* Tap-to-mute overlay */}
      <button
        onClick={onToggleMute}
        aria-label={muted ? "Unmute" : "Mute"}
        className="absolute inset-0 z-10"
      />

      {/* Right action rail */}
      <div className="absolute right-3 bottom-28 z-20 flex flex-col gap-4 items-center">
        <button
          onClick={(e) => { e.stopPropagation(); toggleLike(item); }}
          className="flex flex-col items-center gap-1"
          aria-label="Like"
        >
          <span className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border ${liked ? "bg-cinema-red/30 border-cinema-red text-cinema-red" : "bg-black/40 border-white/20 text-white"}`}>
            <Heart className={`w-5 h-5 ${liked ? "fill-cinema-red" : ""}`} />
          </span>
          <span className="text-[10px] text-white/90 font-medium">Like</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); toggleWatchlist(item); }}
          className="flex flex-col items-center gap-1"
          aria-label="Save"
        >
          <span className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border ${saved ? "bg-primary/30 border-primary text-primary" : "bg-black/40 border-white/20 text-white"}`}>
            <Bookmark className={`w-5 h-5 ${saved ? "fill-primary" : ""}`} />
          </span>
          <span className="text-[10px] text-white/90 font-medium">Save</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
          className="flex flex-col items-center gap-1"
          aria-label="Sound"
        >
          <span className="w-11 h-11 rounded-full bg-black/40 border border-white/20 backdrop-blur-md flex items-center justify-center text-white">
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </span>
          <span className="text-[10px] text-white/90 font-medium">{muted ? "Sound" : "Mute"}</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/movie?title=${encodeURIComponent(trailer.title)}`); }}
          className="flex flex-col items-center gap-1"
          aria-label="Details"
        >
          <span className="w-11 h-11 rounded-full bg-primary/90 flex items-center justify-center text-primary-foreground">
            <Info className="w-5 h-5" />
          </span>
          <span className="text-[10px] text-white/90 font-medium">Info</span>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute left-0 right-16 bottom-0 z-20 p-4 pb-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">▶ Trailer</span>
          <span className="text-[10px] text-white/70">• {trailer.language}</span>
          {trailer.year && <span className="text-[10px] text-white/70">• {trailer.year}</span>}
          <span className="ml-auto flex items-center gap-1 text-[10px] text-primary font-bold">
            <Star className="w-3 h-3 fill-primary" /> {trailer.rating}
          </span>
        </div>
        <h3 className="font-display text-xl font-bold text-white leading-tight line-clamp-2">{trailer.title}</h3>
        {trailer.overview && (
          <p className="text-xs text-white/80 mt-1 line-clamp-2">{trailer.overview}</p>
        )}
      </div>

      {/* Play hint when not active */}
      {!active && (
        <div className="absolute z-10 w-16 h-16 rounded-full bg-primary/80 flex items-center justify-center">
          <Play className="w-7 h-7 text-primary-foreground fill-primary-foreground" />
        </div>
      )}
    </div>
  );
};

const TrailerReels = () => {
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const loadMore = useCallback(async (opts?: { refresh?: boolean }) => {
    if (loading) return;
    setLoading(true);
    try {
      const refresh = !!opts?.refresh;
      const excludeIds = refresh ? [] : trailers.map(t => t.id);
      const { data, error } = await supabase.functions.invoke("trailers", {
        body: { page: refresh ? 1 : page, excludeIds, refresh },
      });
      if (error) throw error;
      const items = (data?.items || []) as Trailer[];
      if (refresh) {
        setTrailers(items);
        setActiveIdx(0);
        setPage(2);
        containerRef.current?.scrollTo({ top: 0, behavior: "auto" });
      } else if (items.length) {
        setTrailers(prev => [...prev, ...items]);
        setPage(p => p + 1);
      }
    } catch (e) {
      console.error("trailers load error", e);
    } finally {
      setLoading(false);
    }
  }, [page, trailers, loading]);

  useEffect(() => { loadMore(); /* initial */ }, []);

  // IntersectionObserver to track active reel
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio >= 0.6) {
            const idx = Number((e.target as HTMLElement).dataset.idx);
            setActiveIdx(idx);
            // prefetch when near end
            if (idx >= trailers.length - 3) loadMore();
          }
        });
      },
      { root: containerRef.current, threshold: [0.6] }
    );
    itemRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [trailers, loadMore]);

  return (
    <div
      ref={containerRef}
      className="h-[100svh] w-full overflow-y-scroll snap-y snap-mandatory bg-black -mx-4"
      style={{ scrollSnapStop: "always", scrollbarWidth: "none" }}
    >
      {/* Refresh button */}
      <button
        onClick={() => loadMore({ refresh: true })}
        disabled={loading}
        aria-label="Refresh trailers"
        className="fixed top-20 right-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-semibold hover:bg-black/80 disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        Refresh
      </button>
      {trailers.map((t, i) => (
        <div
          key={t.id}
          data-idx={i}
          ref={(el) => (itemRefs.current[i] = el)}
        >
          <ReelCard
            trailer={t}
            active={i === activeIdx}
            muted={muted}
            onToggleMute={() => setMuted(m => !m)}
          />
        </div>
      ))}
      {loading && (
        <div className="h-32 flex items-center justify-center text-white/70">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading trailers...
        </div>
      )}
      {!loading && trailers.length === 0 && (
        <div className="h-[100svh] flex items-center justify-center text-white/70 text-sm px-6 text-center">
          No trailers available right now. Pull back later.
        </div>
      )}
    </div>
  );
};

export default TrailerReels;