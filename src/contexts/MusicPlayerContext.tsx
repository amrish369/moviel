import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export interface Song {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration?: string;
  views?: string;
  playlistId?: string; // when set, iframe plays whole YT playlist
  audioUrl?: string; // direct MP3 (Jamendo) → native audio, true background play
  downloadUrl?: string;
}

interface Ctx {
  current: Song | null;
  queue: Song[];
  isPlaying: boolean;
  showVideo: boolean;
  expanded: boolean;
  currentTime: number;
  duration: number;
  play: (song: Song, queue?: Song[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  jumpTo: (index: number) => void;
  close: () => void;
  seekTo: (seconds: number) => void;
  seekBy: (delta: number) => void;
  setShowVideo: (v: boolean) => void;
  setExpanded: (v: boolean) => void;
  registerIframe: (el: HTMLIFrameElement | null) => void;
  /** true when the native audio stream is the active engine */
  audioActive: boolean;
  /** YouTube id currently used by the video iframe */
  playVideoId: string | null;
  videoStart: number;
  resolvingVideo: boolean;
  switchMode: (m: "audio" | "video") => Promise<boolean>;
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const current = queue[index] || null;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isAudioRef = useRef(false);
  const [videoMode, setVideoMode] = useState(false);
  const [ytMap, setYtMap] = useState<Record<string, string>>({});
  const [videoStart, setVideoStart] = useState(0);
  const [resolvingVideo, setResolvingVideo] = useState(false);
  const currentTimeRef = useRef(0);
  currentTimeRef.current = currentTime;
  const playVideoId = current ? (current.audioUrl ? ytMap[current.videoId] || null : current.videoId) : null;
  const audioActive = Boolean(current?.audioUrl) && !(videoMode && playVideoId);
  isAudioRef.current = audioActive;

  const post = useCallback((func: string, args: any[] = []) => {
    if (isAudioRef.current) {
      const a = audioRef.current;
      if (!a) return;
      if (func === "playVideo") a.play().catch(() => {});
      else if (func === "pauseVideo") a.pause();
      else if (func === "seekTo") { try { a.currentTime = args[0]; } catch {} }
      return;
    }
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  }, []);

  const seekTo = useCallback((seconds: number) => {
    const s = Math.max(0, seconds);
    post("seekTo", [s, true]);
    setCurrentTime(s);
  }, [post]);

  const seekBy = useCallback((delta: number) => {
    setCurrentTime((t) => {
      const nx = Math.max(0, Math.min((duration || Number.MAX_SAFE_INTEGER), t + delta));
      post("seekTo", [nx, true]);
      return nx;
    });
  }, [post, duration]);

  const play = useCallback((song: Song, list?: Song[]) => {
    const q = list && list.length ? list : [song];
    const idx = Math.max(0, q.findIndex((s) => s.videoId === song.videoId));
    setQueue(q);
    setIndex(idx);
    setIsPlaying(true);
    setExpanded(true);
    const target = q[idx];
    if (target?.audioUrl) {
      if (!audioRef.current) { audioRef.current = new Audio(); (audioRef.current as any).playsInline = true; }
      const a = audioRef.current;
      a.src = target.audioUrl;
      a.play().catch(() => {});
    } else { try { audioRef.current?.pause(); } catch {} }
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
    setCurrentTime(0);
    setDuration(0);
    try { silentAudioRef.current?.pause(); } catch {}
    try { audioRef.current?.pause(); } catch {}
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
        } else if (data.event === "infoDelivery" && data.info) {
          if (typeof data.info.currentTime === "number") setCurrentTime(data.info.currentTime);
          if (typeof data.info.duration === "number" && data.info.duration > 0) setDuration(data.info.duration);
        }
      } catch {}
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [queue.length, next]);

  // Handshake: tell iframe we want state + info updates, then poll time.
  useEffect(() => {
    if (!current || audioActive || !playVideoId) return;
    const iframe = iframeRef.current;
    const win = iframe?.contentWindow;
    if (!win) return;
    let cancelled = false;
    const handshake = () => {
      try {
        win.postMessage(JSON.stringify({ event: "listening", id: current.videoId }), "*");
        win.postMessage(JSON.stringify({ event: "command", func: "addEventListener", args: ["onStateChange"] }), "*");
      } catch {}
    };
    // Do handshake a few times as iframe may not be ready immediately.
    const t1 = setTimeout(handshake, 300);
    const t2 = setTimeout(handshake, 1200);
    if (!current.audioUrl) { setCurrentTime(0); setDuration(0); }
    const poll = setInterval(() => {
      if (cancelled) return;
      post("getCurrentTime");
      post("getDuration");
    }, 750);
    return () => { cancelled = true; clearTimeout(t1); clearTimeout(t2); clearInterval(poll); };
  }, [playVideoId, current?.playlistId, audioActive, post]); // eslint-disable-line react-hooks/exhaustive-deps

  // Native audio engine for direct-MP3 tracks (works with screen off / background).
  useEffect(() => {
    if (!audioRef.current) {
      const a = new Audio();
      a.preload = "auto";
      (a as any).playsInline = true;
      audioRef.current = a;
    }
    const a = audioRef.current;
    if (!current?.audioUrl || !audioActive) { a.pause(); return; }
    if (a.src !== current.audioUrl) { a.src = current.audioUrl; setCurrentTime(0); setDuration(0); }
    if (isPlaying) a.play().catch(() => {});
  }, [current?.audioUrl, audioActive]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => { if (isAudioRef.current) setCurrentTime(a.currentTime); };
    const onMeta = () => { if (isAudioRef.current && isFinite(a.duration)) setDuration(a.duration); };
    const onPlay = () => { if (isAudioRef.current) setIsPlaying(true); };
    const onPause = () => { if (isAudioRef.current && !a.ended) setIsPlaying(false); };
    const onEnd = () => { if (!isAudioRef.current) return; if (queue.length > 1) next(); else setIsPlaying(false); };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnd);
    };
  }, [queue.length, next, current?.audioUrl]);

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
      try {
        navigator.mediaSession.setActionHandler("seekbackward", (d: any) => seekBy(-(d?.seekOffset || 10)));
        navigator.mediaSession.setActionHandler("seekforward", (d: any) => seekBy(d?.seekOffset || 10));
        navigator.mediaSession.setActionHandler("seekto", (d: any) => { if (typeof d?.seekTime === "number") seekTo(d.seekTime); });
      } catch {}
    } catch {}
  }, [current, isPlaying, post, next, prev, seekBy, seekTo]);

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

  const resolveYt = useCallback(async (song: Song): Promise<string | null> => {
    try {
      const env = (import.meta as any).env;
      const q = `${song.title} ${song.channel.split(",")[0]} official video`;
      const r = await fetch(`https://${env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/music-feed?type=songs&page=1&q=${encodeURIComponent(q)}`, {
        headers: { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      });
      const j = await r.json();
      const id = j?.songs?.find((s: Song) => s?.videoId && !s.videoId.startsWith("pl_"))?.videoId;
      return id || null;
    } catch { return null; }
  }, []);

  const switchMode = useCallback(async (m: "audio" | "video") => {
    if (!current?.audioUrl) { setShowVideo(m === "video"); return true; }
    const t = currentTimeRef.current;
    if (m === "video") {
      let id = ytMap[current.videoId];
      if (!id) {
        setResolvingVideo(true);
        id = (await resolveYt(current)) || "";
        setResolvingVideo(false);
        if (!id) return false;
        setYtMap((p) => ({ ...p, [current.videoId]: id }));
      }
      isAudioRef.current = false;
      try { audioRef.current?.pause(); } catch {}
      setVideoStart(Math.floor(t));
      setShowVideo(true);
      setVideoMode(true);
    } else {
      const a = audioRef.current;
      if (a) { try { a.currentTime = t; } catch {} }
      setVideoMode(false);
    }
    return true;
  }, [current, ytMap, resolveYt]);

  // Keep video mode across songs: resolve the next song's video automatically.
  useEffect(() => {
    if (!videoMode || !current?.audioUrl || ytMap[current.videoId]) return;
    let off = false;
    resolveYt(current).then((id) => {
      if (off) return;
      if (id) { setVideoStart(0); setYtMap((p) => ({ ...p, [current.videoId]: id })); }
    });
    return () => { off = true; };
  }, [current?.videoId, videoMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Screen lock / app minimised while watching video → continue on direct audio.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden" && videoMode && current?.audioUrl && isPlaying) {
        const a = audioRef.current;
        if (a) {
          if (a.src !== current.audioUrl) a.src = current.audioUrl;
          try { a.currentTime = currentTimeRef.current; } catch {}
          isAudioRef.current = true;
          a.play().catch(() => {});
        }
        setVideoMode(false);
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [videoMode, current?.audioUrl, isPlaying]);

  const registerIframe = useCallback((el: HTMLIFrameElement | null) => {
    iframeRef.current = el;
  }, []);

  const value = useMemo<Ctx>(() => ({
    current, queue, isPlaying, showVideo, expanded, currentTime, duration,
    play, toggle, next, prev, jumpTo, close, seekTo, seekBy, setShowVideo, setExpanded, registerIframe,
    audioActive, playVideoId, videoStart, resolvingVideo, switchMode,
  }), [current, queue, isPlaying, showVideo, expanded, currentTime, duration, play, toggle, next, prev, jumpTo, close, seekTo, seekBy, registerIframe, audioActive, playVideoId, videoStart, resolvingVideo, switchMode]);

  return <MusicCtx.Provider value={value}>{children}</MusicCtx.Provider>;
};