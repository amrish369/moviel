import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, Play, Volume2, VolumeX, Star, Bookmark, Heart, Info, RefreshCw, X } from "lucide-react";
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

const ReelCard = ({ trailer, active, preloading, muted, onToggleMute }: {
  trailer: Trailer; active: boolean; preloading: boolean; muted: boolean; onToggleMute: () => void;
}) => {
  const navigate = useNavigate();
  const { likes, watchlist, toggleLike, toggleWatchlist } = useUserLibrary();
  const liked = likes.includes(trailer.id);
  const saved = watchlist.includes(trailer.id);
  const item = { id: trailer.id, title: trailer.title, poster: trailer.poster, year: trailer.year };
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const showVideo = active || preloading;

  const sendCmd = (func: string, args: string[] = []) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "*"
    );
  };

  // Apply the current mute state to the running player (no remount = no restart)
  useEffect(() => {
    if (!active || !iframeRef.current) return;
    sendCmd(muted ? "mute" : "unMute");
    if (!muted) sendCmd("playVideo");
  }, [muted, active]);

  // After the iframe loads: guarantee playback starts, and unmute if the user had sound on
  const handleIframeLoad = () => {
    if (!active) return;
    sendCmd("playVideo");
    if (!muted) sendCmd("unMute");
  };

  // Always start muted in the URL (browser autoplay policy), then unmute via API
  const src = showVideo
    ? `https://www.youtube.com/embed/${trailer.youtubeKey}?autoplay=${active ? 1 : 0}&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${trailer.youtubeKey}&enablejsapi=1&origin=${window.location.origin}`
    : "";

  return (
    <div className="relative h-[100dvh] w-full snap-start snap-always bg-black overflow-hidden flex items-center justify-center">
      {/* Backdrop blur fill */}
      {trailer.backdrop && (
        <img
          src={trailer.backdrop}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-40 scale-110 blur-xl"
        />
      )}

      {/* Video (16:9 letterboxed, centered). Next reel is pre-mounted so swipe-in is instant */}
      {showVideo ? (
        <iframe
          ref={iframeRef}
          key={trailer.youtubeKey}
          src={src}
          title={trailer.title}
          onLoad={handleIframeLoad}
          allow="autoplay; encrypted-media; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          className="relative w-full max-h-full aspect-video pointer-events-none"
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

const TrailerReels = ({ mood, category }: { mood?: string; category?: string }) => {
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const loadMore = useCallback(async (opts?: { refresh?: boolean }) => {
    if (loading) return;
    setLoading(true);
    try {
      const refresh = !!opts?.refresh;
      const excludeIds = refresh ? [] : trailers.map(t => t.id);
      const { data, error } = await supabase.functions.invoke("trailers", {
        body: { page: refresh ? 1 : page, excludeIds, refresh, mood, category },
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
  }, [page, trailers, loading, mood, category]);

  useEffect(() => {
    setTrailers([]);
    setPage(1);
    setActiveIdx(0);
  }, [mood, category]);

  useEffect(() => {
    if (!loading && trailers.length === 0) loadMore();
  }, [loading, trailers.length, loadMore]);

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

  // Lock page scroll while full-screen reels are open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open]);

  const cover = trailers[0];

  if (!open) {
    return (
      <button
        onClick={() => { setActiveIdx(0); setOpen(true); }}
        className="relative w-full aspect-[9/12] sm:aspect-video rounded-2xl overflow-hidden bg-card border border-border text-left group"
        aria-label="Open Trailer Reels"
      >
        {cover?.backdrop || cover?.poster ? (
          <img src={cover.backdrop || cover.poster!} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg">
            {loading && !cover ? <Loader2 className="w-7 h-7 animate-spin text-primary-foreground" /> : <Play className="w-7 h-7 text-primary-foreground fill-primary-foreground ml-1" />}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-[10px] font-bold text-primary uppercase tracking-wider">🎬 Trailer Reels</p>
          <h3 className="font-display text-lg font-bold text-foreground">Tap to watch full-screen</h3>
          <p className="text-xs text-muted-foreground">Swipe up for next trailer 👆</p>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll overscroll-contain snap-y snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {trailers.map((t, i) => (
          <div key={t.id} data-idx={i} ref={(el) => (itemRefs.current[i] = el)}>
            <ReelCard
              trailer={t}
              active={i === activeIdx}
              preloading={i === activeIdx + 1}
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
          <div className="h-full flex items-center justify-center text-white/70 text-sm px-6 text-center">
            No trailers available right now.
          </div>
        )}
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))] bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <button onClick={() => setOpen(false)} aria-label="Close reels"
          className="pointer-events-auto w-10 h-10 rounded-full bg-black/50 border border-white/20 backdrop-blur-md flex items-center justify-center text-white">
          <X className="w-5 h-5" />
        </button>
        <span className="font-display text-sm font-bold text-white">Trailer Reels</span>
        <div className="flex gap-2 pointer-events-auto">
          <button onClick={() => setMuted(m => !m)} aria-label={muted ? "Unmute" : "Mute"}
            className="w-10 h-10 rounded-full bg-black/50 border border-white/20 backdrop-blur-md flex items-center justify-center text-white">
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button onClick={() => loadMore({ refresh: true })} disabled={loading} aria-label="Refresh trailers"
            className="w-10 h-10 rounded-full bg-black/50 border border-white/20 backdrop-blur-md flex items-center justify-center text-white disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrailerReels;