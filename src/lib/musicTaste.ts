import { useEffect, useState } from "react";
import type { Song } from "@/contexts/MusicPlayerContext";

// Spotify/JioSaavn-style taste profile, stored on the device.
// Like = strong signal, play = light signal. Scores decay so new taste wins.
const LIKES_KEY = "cineradar:music:likes";
const TASTE_KEY = "cineradar:music:taste";
const EVT = "cineradar:music-taste";

export const MUSIC_CATS = ["hindi", "haryanvi", "bhojpuri", "punjabi"] as const;
export type LikedSong = Song & { cat?: string; likedAt: number };
type Taste = { cat: Record<string, number>; artist: Record<string, number> };

export const WEIGHTS = { like: 10, unlike: -10, play: 2 };

const read = <T,>(k: string, fb: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const emit = () => window.dispatchEvent(new Event(EVT));

// Song → category seen while browsing (so the player knows it too)
const catMap = new Map<string, string>();
export const rememberCategory = (songs: Song[], cat: string) => {
  if (!(MUSIC_CATS as readonly string[]).includes(cat)) return;
  songs.forEach((s) => catMap.set(s.videoId, cat));
};

export const categoryOf = (id: string) => catMap.get(id);

export const artistOf = (s: Pick<Song, "channel">) =>
  (s.channel || "").replace(/\s*[-–]\s*topic\s*$/i, "").split(/,|&/)[0].trim();

export const getLikedSongs = (): LikedSong[] => read<LikedSong[]>(LIKES_KEY, []);
export const getTaste = (): Taste => read<Taste>(TASTE_KEY, { cat: {}, artist: {} });

export function applySignal(taste: Taste, cat: string | undefined, artist: string, w: number): Taste {
  const t: Taste = { cat: { ...taste.cat }, artist: { ...taste.artist } };
  // gentle decay of everything else on each signal
  for (const k in t.cat) t.cat[k] *= 0.98;
  for (const k in t.artist) t.artist[k] *= 0.98;
  if (cat) t.cat[cat] = Math.max(0, (t.cat[cat] || 0) + w);
  if (artist) t.artist[artist] = Math.max(0, (t.artist[artist] || 0) + w);
  return t;
}

function bump(song: Song, w: number, cat?: string) {
  write(TASTE_KEY, applySignal(getTaste(), cat || catMap.get(song.videoId), artistOf(song), w));
}

export const isLiked = (id: string) => getLikedSongs().some((s) => s.videoId === id);

export function toggleSongLike(song: Song): boolean {
  const list = getLikedSongs();
  const i = list.findIndex((s) => s.videoId === song.videoId);
  if (i >= 0) {
    const [old] = list.splice(i, 1);
    write(LIKES_KEY, list); bump(song, WEIGHTS.unlike, old.cat); emit();
    return false;
  }
  const cat = catMap.get(song.videoId);
  list.unshift({ ...song, cat, likedAt: Date.now() });
  write(LIKES_KEY, list.slice(0, 500)); bump(song, WEIGHTS.like, cat); emit();
  return true;
}

export function trackSongPlay(song: Song) { bump(song, WEIGHTS.play); emit(); }

/** Top categories + artists, best first. */
export function topPicks(taste: Taste = getTaste()) {
  const cats = Object.entries(taste.cat).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  const artists = Object.entries(taste.artist).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  return { cats, artists };
}

export function useMusicTaste() {
  const [liked, setLiked] = useState<LikedSong[]>(getLikedSongs);
  useEffect(() => {
    const f = () => setLiked(getLikedSongs());
    window.addEventListener(EVT, f); window.addEventListener("storage", f);
    return () => { window.removeEventListener(EVT, f); window.removeEventListener("storage", f); };
  }, []);
  return { liked, likedIds: new Set(liked.map((s) => s.videoId)), toggle: toggleSongLike };
}
