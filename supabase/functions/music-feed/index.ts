import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface Song {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  views: string;
  playlistId?: string;
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

  const deepFindString = (obj: any, key: string): string => {
    if (!obj || typeof obj !== 'object') return '';
    if (typeof obj[key] === 'string') return obj[key];
    for (const k of Object.keys(obj)) {
      const v = (obj as any)[k];
      if (v && typeof v === 'object') {
        const r = deepFindString(v, key);
        if (r) return r;
      }
    }
    return '';
  };

  const walk = (node: any) => {
    if (!node || typeof node !== 'object' || out.length >= 40) return;
    if (Array.isArray(node)) { for (const c of node) walk(c); return; }

    // Legacy playlistRenderer
    const pr = node.playlistRenderer;
    if (pr?.playlistId && !seen.has(pr.playlistId)) {
      seen.add(pr.playlistId);
      const title = pr.title?.simpleText || pr.title?.runs?.map((r: any) => r.text).join('') || '';
      const channel = pr.shortBylineText?.runs?.[0]?.text || pr.longBylineText?.runs?.[0]?.text || '';
      const thumbs = pr.thumbnails?.[0]?.thumbnails || pr.thumbnailRenderer?.playlistVideoThumbnailRenderer?.thumbnail?.thumbnails || [];
      const thumbnail = thumbs[thumbs.length - 1]?.url || `https://i.ytimg.com/vi/${pr.navigationEndpoint?.watchEndpoint?.videoId || ''}/hqdefault.jpg`;
      const videoCount = pr.videoCountText?.runs?.map((r: any) => r.text).join('') || pr.videoCountShortText?.simpleText || '';
      if (title) out.push({ playlistId: pr.playlistId, title, channel, thumbnail, videoCount });
    }

    // New lockupViewModel (YT 2024+)
    const lv = node.lockupViewModel;
    if (lv && typeof lv === 'object') {
      const cid: string | undefined = lv.contentId;
      const ctype: string | undefined = lv.contentType;
      if (cid && !seen.has(cid) && (ctype === 'LOCKUP_CONTENT_TYPE_PLAYLIST' || /^(PL|OL|RD|UU|FL)/.test(cid))) {
        seen.add(cid);
        const title = deepFindString(lv.metadata, 'content') || deepFindString(lv, 'accessibilityText') || '';
        // channel: first metadata row
        let channel = '';
        const rows = lv.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows;
        if (Array.isArray(rows)) {
          for (const r of rows) {
            const parts = r?.metadataParts;
            if (Array.isArray(parts)) {
              for (const p of parts) {
                const t = p?.text?.content;
                if (t) { channel = t; break; }
              }
              if (channel) break;
            }
          }
        }
        // videoCount: overlay text often contains "42 videos"
        const videoCount = deepFindString(lv.contentImage, 'text') || '';
        // thumbnail
        const sources = lv.contentImage?.collectionThumbnailViewModel?.primaryThumbnail?.thumbnailViewModel?.image?.sources
          || lv.contentImage?.thumbnailViewModel?.image?.sources
          || [];
        const thumbnail = sources[sources.length - 1]?.url || `https://i.ytimg.com/vi/${cid}/hqdefault.jpg`;
        if (title) out.push({ playlistId: cid, title, channel, thumbnail, videoCount });
      }
    }

    for (const k of Object.keys(node)) walk(node[k]);
  };
  walk(data);
  return out;
}

function textValue(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (typeof node.content === 'string') return node.content;
  if (typeof node.simpleText === 'string') return node.simpleText;
  if (Array.isArray(node.runs)) return node.runs.map((r: any) => r?.text || '').join('');
  return '';
}

function firstTextByKey(node: any, key: string): string {
  if (!node || typeof node !== 'object') return '';
  if (typeof node[key] === 'string') return node[key];
  if (node[key]?.content) return String(node[key].content);
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = firstTextByKey(child, key);
      if (found) return found;
    }
    return '';
  }
  for (const child of Object.values(node)) {
    const found = firstTextByKey(child, key);
    if (found) return found;
  }
  return '';
}

function extractLockupVideo(lv: any, playlistId?: string): Song | null {
  if (!lv || lv.contentType !== 'LOCKUP_CONTENT_TYPE_VIDEO' || !lv.contentId) return null;
  const videoId = String(lv.contentId);
  const title = textValue(lv.metadata?.lockupMetadataViewModel?.title) || firstTextByKey(lv.metadata, 'accessibilityText');
  const rows = lv.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows || [];
  const rowParts = Array.isArray(rows) ? rows.flatMap((r: any) => r?.metadataParts || []) : [];
  const channel = textValue(rowParts[0]?.text);
  const views = textValue(rowParts[1]?.text) || textValue(rowParts[2]?.text) || '';
  const sources = lv.contentImage?.thumbnailViewModel?.image?.sources || [];
  const thumbnail = sources[sources.length - 1]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const badges = lv.contentImage?.thumbnailViewModel?.overlays?.[0]?.thumbnailBottomOverlayViewModel?.badges || [];
  const duration = badges.map((b: any) => b?.thumbnailBadgeViewModel?.text).find(Boolean) || '';
  if (!title) return null;
  return { videoId, title, channel, thumbnail, duration, views, ...(playlistId ? { playlistId } : {}) };
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
  if (!res.ok) return await innertubePlaylistVideos(playlistId);
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
    const lockupSong = extractLockupVideo(node.lockupViewModel);
    if (lockupSong && !seen.has(lockupSong.videoId)) {
      seen.add(lockupSong.videoId);
      out.push(lockupSong);
    }
    for (const k of Object.keys(node)) walk(node[k]);
  };
  walk(data);
  if (out.length > 0) return out;
  return await innertubePlaylistVideos(playlistId);
}

// Innertube (v1) fallback — POST to browse with playlist browseId "VL<playlistId>".
// Much more reliable than HTML scraping when YT ships new markup.
async function innertubePlaylistVideos(playlistId: string): Promise<Song[]> {
  try {
    const body = {
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: '2.20240726.00.00',
          hl: 'en', gl: 'IN',
        },
      },
      browseId: `VL${playlistId}`,
    };
    const r = await fetch(
      'https://www.youtube.com/youtubei/v1/browse?prettyPrint=false',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': YT_UA,
          'Accept-Language': 'en-IN,en;q=0.9',
          'X-YouTube-Client-Name': '1',
          'X-YouTube-Client-Version': '2.20240726.00.00',
        },
        body: JSON.stringify(body),
      },
    );
    if (!r.ok) return [];
    const data = await r.json();
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
      const lockupSong = extractLockupVideo(node.lockupViewModel);
      if (lockupSong && !seen.has(lockupSong.videoId)) {
        seen.add(lockupSong.videoId);
        out.push(lockupSong);
      }
      for (const k of Object.keys(node)) walk(node[k]);
    };
    walk(data);
    return out;
  } catch { return []; }
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

// ---------- AI ranked trending chart ----------
function normTitle(t: string): string {
  return t.toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, ' ')
    .replace(/official|video|lyrical|lyrics|full song|audio|4k|hd|uhd|remix|song|new|latest|20\d\d|\|.*$/g, ' ')
    .replace(/[^a-z0-9\u0900-\u097f]+/g, ' ').trim().slice(0, 40);
}

function parseViews(v: string): number {
  const m = (v || '').replace(/,/g, '').match(/([\d.]+)\s*([KMB])?/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const mul = { K: 1e3, M: 1e6, B: 1e9 }[(m[2] || '').toUpperCase() as 'K'] || 1;
  return n * mul;
}

const CHART_LABEL: Record<string, string> = {
  trending: 'Indian (all languages: Hindi, Punjabi, Haryanvi, Bhojpuri, South)',
  hindi: 'Hindi / Bollywood', haryanvi: 'Haryanvi', bhojpuri: 'Bhojpuri', punjabi: 'Punjabi',
};

const chartCache = new Map<string, { at: number; songs: Song[]; source: string }>();

async function askAi(category: string): Promise<{ list: { title: string; artist: string }[]; source: string }> {
  const today = new Date().toISOString().slice(0, 10);
  const prompt = `Today is ${today}. List the top 25 currently trending ${CHART_LABEL[category] || CHART_LABEL.trending} songs in India right now (YouTube, Spotify, Instagram reels charts), ranked #1 first. Each song must be unique. Return ONLY JSON: {"songs":[{"title":"","artist":""}]}`;
  const parse = (txt: string) => {
    const s = txt.indexOf('{'), e = txt.lastIndexOf('}');
    const j = JSON.parse(txt.slice(s, e + 1));
    return (Array.isArray(j?.songs) ? j.songs : []).filter((x: any) => x?.title).slice(0, 25);
  };
  const grokKey = Deno.env.get('GROK_API_KEY') || Deno.env.get('XAI_API_KEY');
  if (grokKey) {
    try {
      const r = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${grokKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'grok-3-mini', messages: [{ role: 'user', content: prompt }] }),
      });
      if (r.ok) { const list = parse((await r.json())?.choices?.[0]?.message?.content || ''); if (list.length) return { list, source: 'grok' }; }
      else console.log('grok status', r.status);
    } catch (e) { console.log('grok err', String(e)); }
  }
  try {
    const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'google/gemini-2.5-flash', messages: [{ role: 'user', content: prompt }] }),
    });
    if (r.ok) {
      const txt = (await r.json())?.choices?.[0]?.message?.content || '';
      const list = parse(txt);
      console.log('gemini list', list.length, txt.slice(0, 120));
      if (list.length) return { list, source: 'gemini' };
    } else console.log('gemini status', r.status, (await r.text()).slice(0, 200));
  } catch (e) { console.log('gemini err', String(e)); }
  return { list: [], source: 'none' };
}

async function getAiChart(category: string): Promise<{ songs: Song[]; source: string }> {
  const hit = chartCache.get(category);
  if (hit && Date.now() - hit.at < 6 * 3600_000) return hit;
  const { list, source } = await askAi(category);
  console.log('askAi done', category, source, list.length);
  if (!list.length) return { songs: [], source };
  const resolved: (Song | null)[] = [];
  for (let i = 0; i < list.length; i += 6) {
    const batch = await Promise.all(list.slice(i, i + 6).map(async (it) => {
      try {
        const html = await fetchYT(`https://www.youtube.com/results?search_query=${encodeURIComponent(`${it.title} ${it.artist} song`)}&hl=en&gl=IN`);
        return scrapeYouTubeSearch(html)[0] || null;
      } catch { return null; }
    }));
    resolved.push(...batch);
  }
  console.log('chart', category, source, 'ai', list.length, 'resolved', resolved.filter(Boolean).length);
  const out: Song[] = [];
  const ids = new Set<string>(), titles = new Set<string>();
  for (const s of resolved) {
    if (!s) continue;
    const k = normTitle(s.title);
    if (ids.has(s.videoId) || (k && titles.has(k))) continue;
    ids.add(s.videoId); if (k) titles.add(k);
    out.push(s);
  }
  const entry = { at: Date.now(), songs: out, source };
  if (out.length >= 5) chartCache.set(category, entry);
  return entry;
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
    const suggest = url.searchParams.get('suggest')?.trim();

    // Autocomplete suggestions from YouTube's public suggestqueries endpoint.
    if (suggest) {
      try {
        const r = await fetch(
          `https://suggestqueries-clients6.youtube.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(suggest)}&hl=en&gl=IN`,
          { headers: { 'User-Agent': YT_UA, 'Accept-Language': 'en-IN,en;q=0.9' } },
        );
        const raw = await r.text();
        // Response is JSONP-ish: window.google.ac.h([...])
        const start = raw.indexOf('[');
        const end = raw.lastIndexOf(']');
        let items: string[] = [];
        if (start !== -1 && end !== -1) {
          try {
            const arr = JSON.parse(raw.slice(start, end + 1));
            const list = arr?.[1];
            if (Array.isArray(list)) items = list.map((e: any) => (Array.isArray(e) ? e[0] : e)).filter((x) => typeof x === 'string');
          } catch {}
        }
        return new Response(JSON.stringify({ suggestions: items.slice(0, 8) }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600' },
        });
      } catch {
        return new Response(JSON.stringify({ suggestions: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Play whole playlist: return its video list.
    if (playlistId) {
      const songs = await scrapePlaylistVideos(playlistId);
      // Fallback: if scraping fails, return a single synthetic entry that the
      // player will treat as a playlist URL (iframe uses playlistId directly).
      const payload = songs.length > 0
        ? { playlistId, count: songs.length, songs }
        : {
            playlistId,
            count: 1,
            songs: [{
              videoId: `pl_${playlistId}`,
              playlistId,
              title: 'YouTube Playlist',
              channel: '',
              thumbnail: `https://i.ytimg.com/vi/${playlistId}/hqdefault.jpg`,
              duration: '',
              views: '',
            }],
          };
      return new Response(JSON.stringify(payload), {
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

    let songs = rank(scrapeYouTubeSearch(html));
    let source = 'youtube';
    // Page 1 of a category = AI-ranked live chart (Grok → Gemini → YouTube views).
    if (!q && page === 1) {
      const chart = await getAiChart(category);
      if (chart.songs.length >= 5) {
        const seen = new Set(chart.songs.map((s) => normTitle(s.title)));
        songs = [...chart.songs, ...songs.filter((s) => !seen.has(normTitle(s.title)))];
        source = chart.source;
      }
    } else if (!q) {
      songs.sort((a, b) => parseViews(b.views) - parseViews(a.views));
    }
    return new Response(JSON.stringify({ query: baseQuery, category, page, count: songs.length, songs, hasMore: true, source }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), songs: [], playlists: [] }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});