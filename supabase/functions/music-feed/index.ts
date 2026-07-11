import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface Song {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  views: string;
}

const YT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const CATEGORY_QUERIES: Record<string, string> = {
  trending: 'trending indian songs 2026',
  bollywood: 'latest bollywood songs 2026 hindi',
  tamil: 'latest tamil songs 2026',
  telugu: 'latest telugu songs 2026',
  malayalam: 'latest malayalam songs 2026',
  punjabi: 'latest punjabi songs 2026',
  romantic: 'romantic hindi songs 2026',
  party: 'bollywood party songs 2026',
  lofi: 'bollywood lofi mix',
  devotional: 'bhajan devotional songs',
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q')?.trim();
    const category = url.searchParams.get('category')?.trim().toLowerCase() || 'trending';
    const query = q || CATEGORY_QUERIES[category] || CATEGORY_QUERIES.trending;

    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D&hl=en&gl=IN&persist_hl=1&persist_gl=1`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': YT_UA,
        'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
        'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+000; SOCS=CAI',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `YT ${res.status}`, songs: [] }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const html = await res.text();
    const songs = rank(scrapeYouTubeSearch(html));
    return new Response(JSON.stringify({ query, category, count: songs.length, songs }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), songs: [] }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});