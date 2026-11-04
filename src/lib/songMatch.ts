// Turns a messy YouTube title into the plain song name used to find it on JioSaavn.
// e.g. "T-Series: O Maahi | Dunki | SRK" -> "O Maahi", "@Sai Abhyankkar - Radhimaa (Music Video)" -> "Radhimaa"
const LABELS = /^(t-series|tseries|saregama( music)?|zee music( company)?|sony music( india)?|tips( official)?|yrf|speed records|desi music factory|white hill music|wave music|worldwide records)\s*[:\-–|]\s*/i;
const JUNK = /\b(official|music|video|lyrical|lyrics?|full|song|songs|audio|hd|4k|8d|new|latest|punjabi|hindi|haryanvi|bhojpuri|\d{4}|remix|cover|in cinemas now|teaser|trailer|feat\.?|ft\.?|dj|viral|hit|superhit|status|shorts)\b/gi;
const ARTIST_HINT = /\b(khesari|pawan singh|shilpi raj|neelkamal|ritesh pandey|arvind akela|kallu|pramod premi|samar singh|ankush raja|antra singh|priyanka|yadav|nirahua|dinesh lal|tuntun|gunjan singh|shivani singh|new song|ke gana)\b/i;

function scrub(p: string): string {
  return p.replace(/#\S+/g, " ").replace(/@\S+(\s\S+)?/g, " ").replace(JUNK, " ").replace(/[^\p{L}\p{N}\s']/gu, " ").replace(/\s+/g, " ").trim();
}

/** Ordered list of likely song names (best first). */
export function songCandidates(raw: string): string[] {
  const t = (raw || "").replace(/\(.*?\)|\[.*?\]|\{.*?\}/g, " ").replace(LABELS, "");
  const parts = t.split(/\s[|\-–—:]\s|\||:|।/).map((p) => p.trim()).filter(Boolean);
  const good: string[] = [], weak: string[] = [];
  for (const p of parts) {
    if (/^#/.test(p) || p.startsWith("@")) continue; // hashtag / handle segment
    const s = scrub(p);
    if (s.length < 2) continue;
    (ARTIST_HINT.test(p) ? weak : good).push(s);
  }
  // Prefer Latin-script names (JioSaavn titles are mostly English), then Devanagari
  const latin = good.filter((s) => /[a-z]/i.test(s)), other = good.filter((s) => !/[a-z]/i.test(s));
  const out = [...latin, ...other, ...weak];
  if (!out.length) { const s = scrub(t); if (s.length >= 2) out.push(s); }
  return Array.from(new Set(out)).slice(0, 3);
}

export function cleanSongTitle(raw: string): string {
  return songCandidates(raw)[0] || "";
}

const norm = (x: string) => (x || "").toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9\u0900-\u097f]/g, "")
  .replace(/([aeiou])\1+/g, "$1").replace(/(.)\1+/g, "$1"); // Barbaadi ~ Barbadi

export function isSameSong(cleanTitle: string, saavnTitle: string): boolean {
  const a = norm(cleanTitle), b = norm(saavnTitle);
  return Boolean(a && b && (a === b || (a.length >= 3 && (b.startsWith(a) || a.startsWith(b)))));
}
