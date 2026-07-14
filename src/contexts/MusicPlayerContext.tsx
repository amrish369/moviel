import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export interface Song {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration?: string;
  views?: string;
  playlistId?: string; // when set, iframe plays whole YT playlist
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
  jumpTo: (index: number) => void;
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
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<any>(null);

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
    // Kick off the silent keep-alive audio on this user gesture so the OS
    // grants the tab audio focus — this keeps the YouTube iframe from being
    // suspended when the screen locks or the tab is backgrounded.
    try {
      if (!silentAudioRef.current) {
        // 1s of silent MP3 (base64), looped.
        const a = new Audio(
          "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQxAADB8AhSmxhIIEVCSiJrDCQBTcu3UrAIwUdkRgQbFAZC1CQEwTJ9mjRvBA4UOLD8nKVOWfh+UlK3z/177OXrfOdKl7097t597uikn9tGl6JAM1qWFTUpUiUsSyilJKgAAAAA//sQxAoDwAAB/gAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
        );
        a.loop = true;
        a.volume = 0.001;
        (a as any).playsInline = true;
        silentAudioRef.current = a;
      }
      silentAudioRef.current.play().catch(() => {});
    } catch {}
    // Screen Wake Lock — keeps screen from sleeping while listening actively.
    // (Doesn't fire while screen already off, but re-acquired on visibility.)
    if ("wakeLock" in navigator) {
      // @ts-ignore
      navigator.wakeLock.request("screen").then((wl: any) => { wakeLockRef.current = wl; }).catch(() => {});
    }
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

  const jumpTo = useCallback((i: number) => {
    if (i < 0 || i >= queue.length) return;
    setIndex(i);
    setIsPlaying(true);
  }, [queue.length]);

  const close = useCallback(() => {
    setQueue([]);
    setIndex(0);
    setIsPlaying(false);
    setExpanded(false);
    try { silentAudioRef.current?.pause(); } catch {}
    try { wakeLockRef.current?.release?.(); wakeLockRef.current = null; } catch {}
  }, []);

  // Listen for YT iframe end-of-video events -> auto next
  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      if (typeof ev.data !== "string") return;
      try {
        const data = JSON.parse(ev.data);
        if (data.event === "onStateChange") {
          // 0 = ended, 1 = playing, 2 = paused, 3 = buffering
          if (data.info === 0) {
            if (queue.length > 1) next();
            else setIsPlaying(false);
          } else if (data.info === 1) {
            setIsPlaying(true);
          } else if (data.info === 2) {
            setIsPlaying(false);
          }
        }
      } catch {}
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [queue.length, next]);

  // MediaSession API — lock-screen controls + hints to OS to keep audio alive
  // when screen turns off (works on Android Chrome when the tab has audio focus).
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (!current) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
      return;
    }
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: current.channel,
        album: "CineRadar Music",
        artwork: [
          { src: current.thumbnail, sizes: "512x512", type: "image/jpeg" },
          { src: current.thumbnail, sizes: "256x256", type: "image/jpeg" },
          { src: current.thumbnail, sizes: "96x96", type: "image/jpeg" },
        ],
      });
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
      navigator.mediaSession.setActionHandler("play", () => { post("playVideo"); setIsPlaying(true); });
      navigator.mediaSession.setActionHandler("pause", () => { post("pauseVideo"); setIsPlaying(false); });
      navigator.mediaSession.setActionHandler("nexttrack", () => next());
      navigator.mediaSession.setActionHandler("previoustrack", () => prev());
    } catch {}
  }, [current, isPlaying, post, next, prev]);

  // Keep audio playing when the tab goes background / screen locks.
  // Some Android Chrome versions pause a hidden iframe. Re-issue playVideo
  // when we come back to foreground so playback resumes if paused.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && isPlaying) {
        post("playVideo");
        // Re-acquire wake lock, which is released when tab hides.
        if ("wakeLock" in navigator) {
          // @ts-ignore
          navigator.wakeLock.request("screen").then((wl: any) => { wakeLockRef.current = wl; }).catch(() => {});
        }
        // Ensure silent keep-alive is running.
        silentAudioRef.current?.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [isPlaying, post]);

  const registerIframe = useCallback((el: HTMLIFrameElement | null) => {
    iframeRef.current = el;
  }, []);

  const value = useMemo<Ctx>(() => ({
    current, queue, isPlaying, showVideo, expanded,
    play, toggle, next, prev, jumpTo, close, setShowVideo, setExpanded, registerIframe,
  }), [current, queue, isPlaying, showVideo, expanded, play, toggle, next, prev, jumpTo, close, registerIframe]);

  return <MusicCtx.Provider value={value}>{children}</MusicCtx.Provider>;
};