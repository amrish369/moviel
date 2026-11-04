// Turns a messy YouTube title into the plain song name used to find it on JioSaavn.
// e.g. "T-Series: O Maahi | Dunki | SRK" -> "O Maahi", "@Sai Abhyankkar - Radhimaa (Music Video)" -> "Radhimaa"
const LABELS = /^(t-series|tseries|saregama( music)?|zee music( company)?|sony music( india)?|tips( official)?|yrf|speed records|desi music factory|white hill music)\s*[:\-–|]\s*/i;
const JUNK = /\b(official|music|video|lyrical|lyrics?|full|song|songs|audio|hd|4k|8d|new|latest|punjabi|hindi|haryanvi|bhojpuri|\d{4}|remix|cover|in cinemas now|teaser|trailer|feat\.?|ft\.?)\b/gi;

export function cleanSongTitle(raw: string): string {
  let t = (raw || "").replace(/\(.*?\)|\[.*?\]|\{.*?\}/g, " ").replace(LABELS, "");
  const parts = t.split(/\s[|\-–—:]\s|\||:/).map((p) => p.trim()).filter(Boolean);
  // "@Artist - Song" → skip the part that is an @handle
  const pick = parts.find((p) => !p.startsWith("@")) || parts[0] || "";
  return pick.replace(/@\S+(\s\S+)?/g, " ").replace(JUNK, " ").replace(/\s+/g, " ").trim();
}

const norm = (x: string) => (x || "").toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9\u0900-\u097f]/g, "");

export function isSameSong(cleanTitle: string, saavnTitle: string): boolean {
  const a = norm(cleanTitle), b = norm(saavnTitle);
  return Boolean(a && b && (a === b || (a.length >= 3 && (b.startsWith(a) || a.startsWith(b)))));
}
