import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, ExternalLink, RotateCw } from "lucide-react";

interface VideoPlayerProps {
  videoId: string;
  title?: string;
  startSeconds?: number;
  className?: string;
}

const isFullscreenActive = () =>
  !!(
    document.fullscreenElement ||
    // @ts-expect-error vendor prefix
    document.webkitFullscreenElement
  );

const VideoPlayer = ({ videoId, title = "Video player", startSeconds = 0, className = "" }: VideoPlayerProps) => {
  const shellRef = useRef<HTMLDivElement>(null);
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFull(isFullscreenActive());
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  const lockLandscape = useCallback(async () => {
    try {
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (o: string) => Promise<void>;
      };
      await orientation?.lock?.("landscape");
    } catch {
      /* orientation lock not supported — ignore */
    }
  }, []);

  const unlockOrientation = useCallback(() => {
    try {
      screen.orientation?.unlock?.();
    } catch {
      /* ignore */
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = shellRef.current as
      | (HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> })
      | null;
    if (!el) return;

    if (isFullscreenActive()) {
      try {
        if (document.exitFullscreen) await document.exitFullscreen();
        // @ts-expect-error vendor prefix
        else document.webkitExitFullscreen?.();
      } catch {
        /* ignore */
      }
      unlockOrientation();
      return;
    }

    try {
      if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: "hide" });
      else el.webkitRequestFullscreen?.();
      await lockLandscape();
    } catch {
      /* ignore */
    }
  }, [lockLandscape, unlockOrientation]);

  useEffect(() => () => unlockOrientation(), [unlockOrientation]);

  const src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&fs=1${
    startSeconds ? `&start=${Math.floor(startSeconds)}` : ""
  }`;

  return (
    <div
      ref={shellRef}
      className={`relative w-full bg-black rounded-xl overflow-hidden shadow-2xl ${
        isFull ? "rounded-none h-screen flex items-center" : "aspect-video"
      } ${className}`}
    >
      <iframe
        key={videoId}
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="w-full h-full border-0"
      />

      <div className="absolute bottom-2 right-2 flex items-center gap-2">
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open in YouTube"
          onClick={(e) => e.stopPropagation()}
          className="w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 flex items-center justify-center backdrop-blur-sm"
        >
          <ExternalLink className="w-4 h-4 text-white" />
        </a>
        {isFull && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              lockLandscape();
            }}
            aria-label="Rotate to landscape"
            className="w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 flex items-center justify-center backdrop-blur-sm"
          >
            <RotateCw className="w-4 h-4 text-white" />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFullscreen();
          }}
          aria-label={isFull ? "Exit full screen" : "Enter full screen"}
          className="w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 flex items-center justify-center backdrop-blur-sm"
        >
          {isFull ? <Minimize2 className="w-4 h-4 text-white" /> : <Maximize2 className="w-4 h-4 text-white" />}
        </button>
      </div>
    </div>
  );
};

export default VideoPlayer;
