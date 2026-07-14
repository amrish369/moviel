import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Download, ListMusic, Music, Pause, Play, SkipBack, SkipForward, Video, VideoOff, X } from "lucide-react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

const MiniPlayer = () => {
  const { current, queue, isPlaying, showVideo, expanded, toggle, next, prev, jumpTo, close, setShowVideo, setExpanded, registerIframe } = useMusicPlayer();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [showQueue, setShowQueue] = useState(false);

  useEffect(() => {
    registerIframe(iframeRef.current);
  }, [registerIframe, current?.videoId]);

  if (!current) return null;
  const currentIndex = queue.findIndex((s) => s.videoId === current.videoId);
  const upNext = queue.slice(currentIndex + 1).concat(queue.slice(0, Math.max(0, currentIndex)));

  const src = current.playlistId
    ? `https://www.youtube.com/embed/videoseries?list=${current.playlistId}&autoplay=1&enablejsapi=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`
    : `https://www.youtube.com/embed/${current.videoId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`;

  // Single persistent iframe. Wrapper morphs based on expanded/showVideo.
  // When expanded + showVideo: big centered video (fixed positioned).
  // Otherwise: 1x1 offscreen (audio keeps playing).
  const showBigVideo = expanded && showVideo;
  const downloadUrl = current.playlistId
    ? `https://www.y2mate.com/youtube-playlist/${current.playlistId}`
    : `https://www.y2mate.com/youtube/${current.videoId}`;
  const iframeWrapperStyle: React.CSSProperties = showBigVideo
    ? {}
    : { position: "fixed", left: -9999, top: -9999, width: 1, height: 1, opacity: 0, pointerEvents: "none", zIndex: -1 };

  return (
    <>
      {/* Persistent single iframe host */}
      <div
        className={showBigVideo ? "fixed inset-x-0 top-20 mx-auto z-[95] w-full max-w-2xl px-4" : ""}
        style={iframeWrapperStyle}
        aria-hidden={!showBigVideo}
      >
        <div className={showBigVideo ? "aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl" : ""}>
          <iframe
            ref={iframeRef}
            src={src}
            title={current.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className={showBigVideo ? "w-full h-full border-0" : ""}
          />
        </div>
      </div>

      {/* Full-screen expanded UI */}
      {expanded && (
        <div className="fixed inset-0 z-[90] bg-background/95 backdrop-blur-xl flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <button onClick={() => setExpanded(false)} aria-label="Minimize" className="w-10 h-10 rounded-full bg-secondary/60 hover:bg-secondary flex items-center justify-center">
              <ChevronDown className="w-5 h-5 text-foreground" />
            </button>
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Now Playing</span>
            <button onClick={close} aria-label="Close" className="w-10 h-10 rounded-full bg-secondary/60 hover:bg-secondary flex items-center justify-center">
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center px-4 gap-6 overflow-y-auto py-6">
            {/* Spacer for the fixed video above */}
            {showVideo && <div className="w-full max-w-2xl aspect-video" />}
            {!showVideo && (
              <div className="w-64 h-64 rounded-2xl overflow-hidden shadow-2xl relative mt-6">
                <img src={current.thumbnail} alt={current.title} className="w-full h-full object-cover" />
                <div className={`absolute inset-0 flex items-center justify-center ${isPlaying ? "animate-pulse" : ""}`}>
                  <div className="w-16 h-16 rounded-full bg-primary/80 backdrop-blur flex items-center justify-center">
                    <Music className="w-7 h-7 text-primary-foreground" />
                  </div>
                </div>
              </div>
            )}
            <div className="text-center max-w-xl">
              <h2 className="font-display text-xl font-bold text-foreground line-clamp-2">{current.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{current.channel}</p>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={prev} aria-label="Previous" className="w-12 h-12 rounded-full bg-secondary/60 hover:bg-secondary flex items-center justify-center">
                <SkipBack className="w-5 h-5 text-foreground" />
              </button>
              <button onClick={toggle} aria-label={isPlaying ? "Pause" : "Play"} className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 glow-gold flex items-center justify-center">
                {isPlaying ? <Pause className="w-7 h-7 text-primary-foreground fill-primary-foreground" /> : <Play className="w-7 h-7 text-primary-foreground fill-primary-foreground ml-1" />}
              </button>
              <button onClick={next} aria-label="Next" className="w-12 h-12 rounded-full bg-secondary/60 hover:bg-secondary flex items-center justify-center">
                <SkipForward className="w-5 h-5 text-foreground" />
              </button>
            </div>
            <button
              onClick={() => setShowVideo(!showVideo)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/60 hover:bg-secondary text-xs font-semibold text-foreground"
            >
              {showVideo ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              {showVideo ? "Audio only" : "Show video"}
            </button>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/15 border border-primary/40 hover:bg-primary/25 text-xs font-semibold text-primary"
            >
              <Download className="w-4 h-4" /> Download MP3
            </a>
            <p className="text-[10px] text-muted-foreground text-center max-w-md">
              Audio background me chalta rahega jab tak app khula hai. Mobile screen-off par YouTube pause kar sakta hai.
            </p>

            {queue.length > 1 && (
              <div className="w-full max-w-xl mt-2">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <ListMusic className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Up Next</h3>
                  <span className="text-[10px] text-muted-foreground">{queue.length} songs</span>
                </div>
                <ul className="divide-y divide-border rounded-xl overflow-hidden border border-border bg-background/50">
                  {queue.map((s, i) => {
                    const active = i === currentIndex;
                    return (
                      <li key={`${s.videoId}-${i}`}>
                        <button
                          onClick={() => jumpTo(i)}
                          className={`w-full flex items-center gap-3 p-2.5 text-left hover:bg-secondary/60 transition ${active ? "bg-secondary/70" : ""}`}
                        >
                          <span className="w-6 text-xs font-mono text-muted-foreground shrink-0 text-center">
                            {active ? <Play className="w-3 h-3 text-primary fill-primary inline" /> : i + 1}
                          </span>
                          <div className="relative w-14 h-9 rounded overflow-hidden shrink-0 bg-secondary">
                            <img src={s.thumbnail} alt="" loading="lazy" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-semibold line-clamp-1 ${active ? "text-primary" : "text-foreground"}`}>{s.title}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{s.channel}{s.duration ? ` • ${s.duration}` : ""}</p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mini bar */}
      {!expanded && (
        <div className="fixed bottom-0 left-0 right-0 z-[80] bg-background/95 backdrop-blur-xl border-t border-border">
          {showQueue && queue.length > 1 && (
            <div className="max-w-4xl mx-auto px-3 pt-2 pb-1 max-h-64 overflow-y-auto border-b border-border">
              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Up Next • {queue.length}</span>
                <button onClick={() => setShowQueue(false)} className="text-[10px] text-primary font-semibold">Hide</button>
              </div>
              <ul className="divide-y divide-border/60">
                {queue.map((s, i) => {
                  const active = i === currentIndex;
                  return (
                    <li key={`${s.videoId}-${i}`}>
                      <button
                        onClick={() => jumpTo(i)}
                        className={`w-full flex items-center gap-2 py-1.5 text-left ${active ? "opacity-100" : "opacity-90 hover:opacity-100"}`}
                      >
                        <span className="w-5 text-[10px] font-mono text-muted-foreground shrink-0 text-center">
                          {active ? <Play className="w-2.5 h-2.5 text-primary fill-primary inline" /> : i + 1}
                        </span>
                        <img src={s.thumbnail} alt="" loading="lazy" className="w-10 h-6 rounded object-cover shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className={`text-[11px] font-semibold line-clamp-1 ${active ? "text-primary" : "text-foreground"}`}>{s.title}</p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <div className="max-w-4xl mx-auto px-3 py-2 flex items-center gap-3">
            <button onClick={() => setExpanded(true)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
              <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-secondary">
                <img src={current.thumbnail} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <ChevronUp className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">{current.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">{current.channel}</p>
              </div>
            </button>
            {queue.length > 1 && (
              <button onClick={() => setShowQueue((v) => !v)} aria-label="Queue" className={`w-8 h-8 rounded-full flex items-center justify-center ${showQueue ? "bg-primary/20 text-primary" : "hover:bg-secondary text-foreground"}`}>
                <ListMusic className="w-4 h-4" />
              </button>
            )}
            <button onClick={prev} aria-label="Previous" className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center">
              <SkipBack className="w-4 h-4 text-foreground" />
            </button>
            <button onClick={toggle} aria-label={isPlaying ? "Pause" : "Play"} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              {isPlaying ? <Pause className="w-4 h-4 text-primary-foreground fill-primary-foreground" /> : <Play className="w-4 h-4 text-primary-foreground fill-primary-foreground ml-0.5" />}
            </button>
            <button onClick={next} aria-label="Next" className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center">
              <SkipForward className="w-4 h-4 text-foreground" />
            </button>
            <button onClick={close} aria-label="Close" className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MiniPlayer;