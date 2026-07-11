import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Music, Pause, Play, SkipBack, SkipForward, Video, VideoOff, X } from "lucide-react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

const MiniPlayer = () => {
  const { current, isPlaying, showVideo, expanded, toggle, next, prev, close, setShowVideo, setExpanded, registerIframe } = useMusicPlayer();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    registerIframe(iframeRef.current);
  }, [registerIframe, current?.videoId]);

  useEffect(() => { setReady(false); }, [current?.videoId]);

  if (!current) return null;

  const src = `https://www.youtube.com/embed/${current.videoId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`;

  return (
    <>
      {/* Full-screen expanded player */}
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
          <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6 overflow-y-auto py-6">
            <div className={`w-full max-w-2xl rounded-2xl overflow-hidden bg-black shadow-2xl ${showVideo ? "aspect-video" : "hidden"}`}>
              <iframe
                ref={iframeRef}
                src={src}
                title={current.title}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                onLoad={() => setReady(true)}
                className="w-full h-full border-0"
              />
            </div>
            {!showVideo && (
              <div className="w-64 h-64 rounded-2xl overflow-hidden shadow-2xl relative">
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
            <p className="text-[10px] text-muted-foreground text-center max-w-md">
              Tip: audio background me chalta rahega jab tak app khula hai. Mobile me screen off hone par YouTube pause kar sakta hai.
            </p>
          </div>
          {/* Keep iframe mounted while expanded — actual iframe above */}
        </div>
      )}

      {/* Hidden iframe host when collapsed — ensures playback continues across routes */}
      {!expanded && (
        <div
          aria-hidden
          className="fixed pointer-events-none opacity-0"
          style={{ width: 1, height: 1, left: -9999, top: -9999 }}
        >
          <iframe
            ref={iframeRef}
            src={src}
            title={current.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            onLoad={() => setReady(true)}
          />
        </div>
      )}

      {/* Mini bar (visible when collapsed) */}
      {!expanded && (
        <div className="fixed bottom-0 left-0 right-0 z-[80] bg-background/95 backdrop-blur-xl border-t border-border">
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
      {!ready && null}
    </>
  );
};

export default MiniPlayer;