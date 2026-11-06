import { useEffect, useRef, useState } from "react";
import { Lock, LockOpen, Sun, Volume2 } from "lucide-react";

type Props = {
  iframe: HTMLIFrameElement | null;
  locked: boolean;
  onLockChange: (v: boolean) => void;
  brightness: number;
  onBrightness: (v: number) => void;
  onTap?: () => void;
};

/**
 * Transparent layer covering the YouTube iframe.
 * - Blocks every tap on YouTube (no redirect / title / logo clicks)
 * - Left side vertical swipe = brightness, right side = volume
 * - Lock mode: ignores all touches until the lock button is pressed
 */
const VideoGestureLayer = ({ iframe, locked, onLockChange, brightness, onBrightness, onTap }: Props) => {
  const [volume, setVolume] = useState(100);
  const [hud, setHud] = useState<null | { kind: "vol" | "light"; value: number }>(null);
  const [showLock, setShowLock] = useState(false);
  const start = useRef<{ x: number; y: number; side: "l" | "r"; base: number; moved: boolean } | null>(null);
  const hudTimer = useRef<number>();
  const lockTimer = useRef<number>();

  const sendVolume = (v: number) => {
    iframe?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "setVolume", args: [v] }), "*");
    if (v > 0) iframe?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "unMute", args: [] }), "*");
  };

  const flashHud = (kind: "vol" | "light", value: number) => {
    setHud({ kind, value });
    window.clearTimeout(hudTimer.current);
    hudTimer.current = window.setTimeout(() => setHud(null), 800);
  };

  const flashLock = () => {
    setShowLock(true);
    window.clearTimeout(lockTimer.current);
    lockTimer.current = window.setTimeout(() => setShowLock(false), 2500);
  };

  useEffect(() => () => { window.clearTimeout(hudTimer.current); window.clearTimeout(lockTimer.current); }, []);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (locked) { flashLock(); return; }
    const r = e.currentTarget.getBoundingClientRect();
    const side = e.clientX - r.left < r.width / 2 ? "l" : "r";
    start.current = { x: e.clientX, y: e.clientY, side, base: side === "l" ? brightness : volume, moved: false };
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = start.current;
    if (!s || locked) return;
    const h = e.currentTarget.getBoundingClientRect().height || 1;
    const dy = s.y - e.clientY;
    if (!s.moved && Math.abs(dy) < 12) return;
    s.moved = true;
    const delta = (dy / h) * 100;
    if (s.side === "l") {
      const v = Math.max(20, Math.min(150, s.base + delta));
      onBrightness(v);
      flashHud("light", Math.round(((v - 20) / 130) * 100));
    } else {
      const v = Math.round(Math.max(0, Math.min(100, s.base + delta)));
      setVolume(v);
      sendVolume(v);
      flashHud("vol", v);
    }
  };
  const onUp = () => {
    const s = start.current;
    start.current = null;
    if (s && !s.moved) { onTap?.(); flashLock(); }
  };

  return (
    <>
      <div
        className="absolute inset-0 z-10 touch-none select-none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => (start.current = null)}
        onContextMenu={(e) => e.preventDefault()}
      />
      {hud && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex items-center gap-2 px-4 py-2 rounded-full bg-background/70 backdrop-blur">
          {hud.kind === "vol" ? <Volume2 className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
          <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${hud.value}%` }} />
          </div>
          <span className="text-xs font-mono text-foreground w-8 text-right">{hud.value}</span>
        </div>
      )}
      {(showLock || locked) && (
        <button
          onClick={() => { onLockChange(!locked); flashLock(); }}
          aria-label={locked ? "Unlock screen" : "Lock screen"}
          className={`absolute left-1/2 -translate-x-1/2 bottom-3 z-30 w-11 h-11 rounded-full backdrop-blur flex items-center justify-center transition-opacity ${locked ? "bg-primary/80" : "bg-background/60"} ${locked && !showLock ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          {locked ? <Lock className="w-5 h-5 text-primary-foreground" /> : <LockOpen className="w-5 h-5 text-foreground" />}
        </button>
      )}
    </>
  );
};

export default VideoGestureLayer;
