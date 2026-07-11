import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export interface Song {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration?: string;
  views?: string;
}

interface Ctx {
  current: Song | null;
  queue: Song[];
  isPlaying: boolean;
  showVideo: boolean;
  expanded: boolean;
  play: (song: Song, queue?: Song[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  close: () => void;
  setShowVideo: (v: boolean) => void;
  setExpanded: (v: boolean) => void;
  registerIframe: (el: HTMLIFrameElement | null) => void;
}

const MusicCtx = createContext<Ctx | null>(null);

export const useMusicPlayer = () => {
  const c = useContext(MusicCtx);
  if (!c) throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  return c;
};

export const MusicPlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [queue, setQueue] = useState<Song[]>([]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const current = queue[index] || null;

  const post = useCallback((func: string, args: any[] = []) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  }, []);

  const play = useCallback((song: Song, list?: Song[]) => {
    const q = list && list.length ? list : [song];
    const idx = Math.max(0, q.findIndex((s) => s.videoId === song.videoId));
    setQueue(q);
    setIndex(idx);
    setIsPlaying(true);
    setExpanded(true);
  }, []);

  const toggle = useCallback(() => {
    setIsPlaying((p) => {
      const nx = !p;
      post(nx ? "playVideo" : "pauseVideo");
      return nx;
    });
  }, [post]);

  const next = useCallback(() => {
    setIndex((i) => (queue.length ? (i + 1) % queue.length : 0));
    setIsPlaying(true);
  }, [queue.length]);

  const prev = useCallback(() => {
    setIndex((i) => (queue.length ? (i - 1 + queue.length) % queue.length : 0));
    setIsPlaying(true);
  }, [queue.length]);

  const close = useCallback(() => {
    setQueue([]);
    setIndex(0);
    setIsPlaying(false);
    setExpanded(false);
  }, []);

  // Listen for YT iframe end-of-video events -> auto next
  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      if (typeof ev.data !== "string") return;
      try {
        const data = JSON.parse(ev.data);
        if (data.event === "onStateChange" && data.info === 0) {
          // ended
          if (queue.length > 1) next();
          else setIsPlaying(false);
        }
      } catch {}
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [queue.length, next]);

  const registerIframe = useCallback((el: HTMLIFrameElement | null) => {
    iframeRef.current = el;
  }, []);

  const value = useMemo<Ctx>(() => ({
    current, queue, isPlaying, showVideo, expanded,
    play, toggle, next, prev, close, setShowVideo, setExpanded, registerIframe,
  }), [current, queue, isPlaying, showVideo, expanded, play, toggle, next, prev, close, registerIframe]);

  return <MusicCtx.Provider value={value}>{children}</MusicCtx.Provider>;
};