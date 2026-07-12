import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface Song {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  views: string;
}

interface Playlist {
  playlistId: string;
  title: string;
  channel: string;
  thumbnail: string;
  videoCount: string;
}

const YT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

// Only these 4 languages, each has multiple query variants so infinite scroll can
// rotate through them and keep surfacing fresh results.
const CATEGORY_VARIANTS: Record<string, string[]> = {
  trending: [
    'trending indian songs 2026', 'viral indian songs 2025',
    'top indian hits 2024', 'best indian songs 2023',
    'hit indian song 2022', 'popular indian song',
  ],
  hindi: [
    'latest bollywood hindi songs 2026', 'top bollywood songs 2025',
    'best hindi songs 2024', 'hindi hit songs 2023',
    'romantic hindi songs', 'bollywood party songs',
    'hindi sad songs', 'hindi love songs 2022',
  ],
  haryanvi: [
    'latest haryanvi songs 2026', 'top haryanvi songs 2025',
    'haryanvi hit songs 2024', 'haryanvi dj songs',
    'sapna choudhary songs', 'renuka panwar songs',
    'ajay hooda haryanvi songs', 'pranjal dahiya songs',
  ],
  bhojpuri: [
    'latest bhojpuri songs 2026', 'top bhojpuri songs 2025',
    'bhojpuri hit songs 2024', 'pawan singh songs',
    'khesari lal yadav songs', 'nirahua songs',
    'bhojpuri new song', 'shilpi raj bhojpuri',
  ],
  punjabi: [
    'latest punjabi songs 2026', 'top punjabi songs 2025',
    'punjabi hit songs 2024', 'punjabi bhangra songs',
    'diljit dosanjh songs', 'ap dhillon songs',
    'karan aujla songs', 'sidhu moose wala songs',
  ],
};

function scrapeYouTubeSearch(html: string): Song[] {
  const markers = [
    'var ytInitialData = ',
    'window["ytInitialData"] = ',
    "window['ytInitialData'] = ",
    'ytInitialData = ',
  ];
  let jsonStart = -1;
  for (const m of markers) {
    const idx = html.indexOf(m);
    if (idx !== -1) { jsonStart = idx + m.length; break; }
  }
  if (jsonStart === -1) return [];
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = jsonStart; i < html.length; i++) {
    const ch = html[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  if (end === -1) return [];
  let data: any;
  try { data = JSON.parse(html.slice(jsonStart, end)); } catch { return []; }

  const songs: Song[] = [];
  const seen = new Set<string>();
  const walk = (node: any) => {
    if (!node || typeof node !== 'object' || songs.length >= 60) return;
    if (Array.isArray(node)) { for (const c of node) walk(c); return; }
    const vr = node.videoRenderer;
    if (vr?.videoId && !seen.has(vr.videoId)) {
      seen.add(vr.videoId);
      const title = vr.title?.runs?.map((r: any) => r.text).join('') || vr.title?.simpleText || '';
      const channel = vr.ownerText?.runs?.[0]?.text || vr.longBylineText?.runs?.[0]?.text || '';
      const thumbs = vr.thumbnail?.thumbnails || [];
      const thumbnail = thumbs[thumbs.length - 1]?.url || `https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`;
      const duration = vr.lengthText?.simpleText || '';
      const views = vr.shortViewCountText?.simpleText || vr.viewCountText?.simpleText || '';
      const durSec = parseDur(duration);
      if (durSec == null || (durSec >= 45 && durSec <= 900)) {
        songs.push({ videoId: vr.videoId, title, channel, thumbnail, duration, views });
      }
    }
    for (const k of Object.keys(node)) walk(node[k]);
  };
  walk(data);
  return songs;
}

function scrapePlaylists(html: string): Playlist[] {
  const markers = ['var ytInitialData = ', 'ytInitialData = '];
  let jsonStart = -1;
  for (const m of markers) { const idx = html.indexOf(m); if (idx !== -1) { jsonStart = idx + m.length; break; } }
  if (jsonStart === -1) return [];
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = jsonStart; i < html.length; i++) {
    const ch = html[i];
    if (inStr) { if (esc) { esc = false; continue; } if (ch === '\\') { esc = true; continue; } if (ch === '"') inStr = false; continue; }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  if (end === -1) return [];
  let data: any;
  try { data = JSON.parse(html.slice(jsonStart, end)); } catch { return []; }
  const out: Playlist[] = [];
  const seen = new Set<string>();
  const walk = (node: any) => {
    if (!node || typeof node !== 'object' || out.length >= 40) return;
    if (Array.isArray(node)) { for (const c of node) walk(c); return; }
    const pr = node.playlistRenderer || node.lockupViewModel;
    const pid = node.playlistRenderer?.playlistId;
    if (pid && !seen.has(pid)) {
      seen.add(pid);
      const title = pr.title?.simpleText || pr.title?.runs?.map((r: any) => r.text).join('') || '';
      const channel = pr.shortBylineText?.runs?.[0]?.text || pr.longBylineText?.runs?.[0]?.text || '';
      const thumbs = pr.thumbnails?.[0]?.thumbnails || pr.thumbnailRenderer?.playlistVideoThumbnailRenderer?.thumbnail?.thumbnails || [];
      const thumbnail = thumbs[thumbs.length - 1]?.url || `https://i.ytimg.com/vi/${pr.navigationEndpoint?.watchEndpoint?.videoId || ''}/hqdefault.jpg`;
      const videoCount = pr.videoCountText?.runs?.map((r: any) => r.text).join('') || pr.videoCountShortText?.simpleText || '';
      if (title) out.push({ playlistId: pid, title, channel, thumbnail, videoCount });
    }
    for (const k of Object.keys(node)) walk(node[k]);
  };
  walk(data);
  return out;
}

async function scrapePlaylistVideos(playlistId: string): Promise<Song[]> {
  const url = `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}&hl=en&gl=IN`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': YT_UA,
      'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
      'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+000; SOCS=CAI',
    },
  });
  if (!res.ok) return [];
  const html = await res.text();
  const markers = ['var ytInitialData = ', 'ytInitialData = '];
  let jsonStart = -1;
  for (const m of markers) { const idx = html.indexOf(m); if (idx !== -1) { jsonStart = idx + m.length; break; } }
  if (jsonStart === -1) return [];
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = jsonStart; i < html.length; i++) {
    const ch = html[i];
    if (inStr) { if (esc) { esc = false; continue; } if (ch === '\\') { esc = true; continue; } if (ch === '"') inStr = false; continue; }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  if (end === -1) return [];
  let data: any;
  try { data = JSON.parse(html.slice(jsonStart, end)); } catch { return []; }
  const out: Song[] = [];
  const seen = new Set<string>();
  const walk = (node: any) => {
    if (!node || typeof node !== 'object' || out.length >= 200) return;
    if (Array.isArray(node)) { for (const c of node) walk(c); return; }
    const pv = node.playlistVideoRenderer;
    if (pv?.videoId && !seen.has(pv.videoId)) {
      seen.add(pv.videoId);
      const title = pv.title?.runs?.map((r: any) => r.text).join('') || pv.title?.simpleText || '';
      const channel = pv.shortBylineText?.runs?.[0]?.text || '';
      const thumbs = pv.thumbnail?.thumbnails || [];
      const thumbnail = thumbs[thumbs.length - 1]?.url || `https://i.ytimg.com/vi/${pv.videoId}/hqdefault.jpg`;
      const duration = pv.lengthText?.simpleText || '';
      out.push({ videoId: pv.videoId, title, channel, thumbnail, duration, views: '' });
    }
    for (const k of Object.keys(node)) walk(node[k]);
  };
  walk(data);
  return out;
}

function parseDur(t: string): number | null {
  if (!t) return null;
  const p = t.split(':').map((x) => parseInt(x, 10));
  if (p.some(isNaN)) return null;
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  if (p.length === 2) return p[0] * 60 + p[1];
  return p[0];
}

function rank(all: Song[]): Song[] {
  const filtered = all.filter((s) => {
    const t = s.title.toLowerCase();
    const noise = t.includes('reaction') || t.includes('review') || t.includes('interview') || t.includes('#shorts');
    return !noise;
  });
  const dedup: Song[] = [];
  const seen = new Set<string>();
  for (const s of filtered) {
    const key = s.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 60);
    if (seen.has(key)) continue;
    seen.add(key);
    dedup.push(s);
  }
  const officialRx = /(t-series|sony music|zee music|yrf|saregama|aditya music|lahari|shemaroo|muzik247|think music|divo|speed records|white hill)/i;
  dedup.sort((a, b) => (officialRx.test(b.channel) ? 1 : 0) - (officialRx.test(a.channel) ? 1 : 0));
  return dedup.slice(0, 40);
}

async function fetchYT(searchUrl: string): Promise<string> {
  const res = await fetch(searchUrl, {
    headers: {
      'User-Agent': YT_UA,
      'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
      'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+000; SOCS=CAI',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });
  if (!res.ok) return '';
  return await res.text();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q')?.trim();
    const category = url.searchParams.get('category')?.trim().toLowerCase() || 'trending';
    const type = url.searchParams.get('type')?.trim().toLowerCase() || 'songs'; // songs | playlists
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const playlistId = url.searchParams.get('playlistId')?.trim();

    // Play whole playlist: return its video list.
    if (playlistId) {
      const songs = await scrapePlaylistVideos(playlistId);
      return new Response(JSON.stringify({ playlistId, count: songs.length, songs }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
      });
    }

    // Build a query variant. Search (q) rotates by adding year/keyword suffixes so page N differs.
    let baseQuery: string;
    if (q) {
      const suffixes = ['songs', 'all songs', 'hit songs', 'top songs', 'new songs 2026', 'songs 2025', 'songs 2024', 'best songs'];
      baseQuery = `${q} ${suffixes[(page - 1) % suffixes.length]}`;
    } else {
      const variants = CATEGORY_VARIANTS[category] || CATEGORY_VARIANTS.trending;
      baseQuery = variants[(page - 1) % variants.length];
    }

    // sp filter: EgIQAQ = videos, EgIQAw = playlists
    const spFilter = type === 'playlists' ? 'EgIQAw%253D%253D' : 'EgIQAQ%253D%253D';
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(baseQuery)}&sp=${spFilter}&hl=en&gl=IN&persist_hl=1&persist_gl=1`;
    const html = await fetchYT(searchUrl);
    if (!html) {
      return new Response(JSON.stringify({ error: 'YT fetch failed', songs: [], playlists: [] }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (type === 'playlists') {
      const playlists = scrapePlaylists(html);
      return new Response(JSON.stringify({ query: baseQuery, page, count: playlists.length, playlists, hasMore: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800' },
      });
    }

    const songs = rank(scrapeYouTubeSearch(html));
    return new Response(JSON.stringify({ query: baseQuery, category, page, count: songs.length, songs, hasMore: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), songs: [], playlists: [] }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});