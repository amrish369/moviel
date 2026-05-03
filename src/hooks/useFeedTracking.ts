import { useCallback, useEffect, useRef } from "react";

const VIEWED_KEY = "cineradar:feed:viewed"; // { date: "YYYY-MM-DD", ids: number[] }
const INTERESTS_KEY = "cineradar:feed:interests"; // { "genre:28": 5, "lang:hi": 8 }
const LIKES_KEY = "cineradar:feed:likes"; // number[]
const MAX_VIEWED = 500;

const today = () => new Date().toISOString().substring(0, 10);

function readJSON<T>(k: string, fb: T): T {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : fb; } catch { return fb; }
}
function writeJSON(k: string, v: unknown) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ }
}

export function getViewedIds(): number[] {
  const v = readJSON<{ date: string; ids: number[] }>(VIEWED_KEY, { date: today(), ids: [] });
  if (v.date !== today()) return []; // daily reset
  return v.ids || [];
}

export function getInterests(): Record<string, number> {
  return readJSON<Record<string, number>>(INTERESTS_KEY, {});
}

export function getLikes(): number[] {
  return readJSON<number[]>(LIKES_KEY, []);
}

function bumpInterest(item: { genreIds?: number[]; langCode?: string }, weight: number) {
  const interests = getInterests();
  if (item.langCode) interests[`lang:${item.langCode}`] = (interests[`lang:${item.langCode}`] || 0) + weight;
  for (const g of item.genreIds || []) {
    interests[`genre:${g}`] = (interests[`genre:${g}`] || 0) + weight;
  }
  // decay cap
  for (const k of Object.keys(interests)) {
    if (interests[k] > 100) interests[k] = 100;
  }
  writeJSON(INTERESTS_KEY, interests);
}

export function markViewed(id: number, item?: { genreIds?: number[]; langCode?: string }) {
  const cur = readJSON<{ date: string; ids: number[] }>(VIEWED_KEY, { date: today(), ids: [] });
  const ids = cur.date === today() ? cur.ids : [];
  if (!ids.includes(id)) {
    ids.push(id);
    while (ids.length > MAX_VIEWED) ids.shift();
    writeJSON(VIEWED_KEY, { date: today(), ids });
    if (item) bumpInterest(item, 1);
  }
}

export function trackClick(item: { id: number; genreIds?: number[]; langCode?: string }) {
  bumpInterest(item, 2);
}

export function toggleLike(item: { id: number; genreIds?: number[]; langCode?: string }): boolean {
  const likes = getLikes();
  const idx = likes.indexOf(item.id);
  if (idx >= 0) {
    likes.splice(idx, 1); writeJSON(LIKES_KEY, likes);
    bumpInterest(item, -1);
    return false;
  }
  likes.push(item.id); writeJSON(LIKES_KEY, likes);
  bumpInterest(item, 4);
  return true;
}

export function trackScrollTime(item: { id: number; genreIds?: number[]; langCode?: string }, ms: number) {
  // 2s+ in view counts as engagement
  if (ms >= 2000) bumpInterest(item, Math.min(3, Math.floor(ms / 2000)));
}

/** Track how long an element stays >50% visible */
export function useDwellTime(
  ref: React.RefObject<Element>,
  onDwell: (ms: number) => void,
) {
  const enteredAt = useRef<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && e.intersectionRatio >= 0.5) {
          enteredAt.current = Date.now();
        } else if (enteredAt.current) {
          onDwell(Date.now() - enteredAt.current);
          enteredAt.current = null;
        }
      }
    }, { threshold: [0, 0.5, 1] });
    obs.observe(el);
    return () => {
      if (enteredAt.current) onDwell(Date.now() - enteredAt.current);
      obs.disconnect();
    };
  }, [ref, onDwell]);
}

export function useStableCallback<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef(fn);
  useEffect(() => { ref.current = fn; });
  return useCallback(((...a: any[]) => ref.current(...a)) as T, []);
}