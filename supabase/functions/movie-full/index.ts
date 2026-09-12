import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface Vid {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  durationSec: number;
  views: string;
}

const YT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function parseDurationToSeconds(txt: string): number | null {
  if (!txt) return null;
  const parts = txt.split(':').map((p) => parseInt(p, 10));
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return null;
}

function scrapeYouTubeSearch(html: string): Vid[] {
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

  const out: Vid[] = [];
  const seen = new Set<string>();
  const walk = (node: any) => {
    if (!node || typeof node !== 'object' || out.length >= 60) return;
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
      const durationSec = parseDurationToSeconds(duration) ?? 0;
      out.push({ videoId: vr.videoId, title, channel, thumbnail, duration, durationSec, views });
    }
    for (const key of Object.keys(node)) walk(node[key]);
  };
  walk(data);
  return out;
}

const BLOCK = /(trailer|teaser|song|lyrical|jukebox|review|reaction|explained|shorts|scene|clip|making|behind the scenes|promo|interview|bgm|audio launch|first look|ending|recap|summary|status|whatsapp)/i;

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\u0900-\u097F ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function titleOverlap(videoTitle: string, movieTitle: string): number {
  const vt = norm(videoTitle);
  const words = norm(movieTitle).split(' ').filter((w) => w.length > 2);
  if (words.length === 0) return 0;
  const hit = words.filter((w) => vt.includes(w)).length;
  return hit / words.length;
}

function rank(all: Vid[], title: string, year?: number | null) {
  const map = new Map<string, Vid>();
  for (const v of all) if (!map.has(v.videoId)) map.set(v.videoId, v);

  const candidates = [...map.values()].filter((v) => {
    if (v.durationSec < 70 * 60) return false;
    if (BLOCK.test(v.title)) return false;
    return titleOverlap(v.title, title) >= 0.6;
  });

  const officialRx = /(goldmines|shemaroo|ultra|pen movies|zee|sony|eros|yrf|tips|rajshri|volga|aditya|lahari|bhojpuri|movies|cinema|film)/i;
  const scored = candidates.map((v) => {
    let s = titleOverlap(v.title, title) * 100;
    if (/full movie/i.test(v.title)) s += 25;
    if (officialRx.test(v.channel)) s += 15;
    if (year && v.title.includes(String(year))) s += 10;
    if (v.durationSec >= 90 * 60) s += 10;
    return { v, s };
  });
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, 8).map(({ v }) => ({
    videoId: v.videoId,
    title: v.title,
    channel: v.channel,
    thumbnail: v.thumbnail,
    duration: v.duration,
    views: v.views,
  }));
}

async function ytSearch(q: string): Promise<Vid[]> {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=EgIQAQ%253D%253D&hl=en&gl=IN&persist_hl=1&persist_gl=1`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': YT_UA,
      'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
      'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+000; SOCS=CAI',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });
  if (!res.ok) return [];
  return scrapeYouTubeSearch(await res.text());
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    let title = '';
    let year: number | null = null;
    let language = '';
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      title = typeof body?.title === 'string' ? body.title.trim().slice(0, 120) : '';
      year = Number.isFinite(Number(body?.year)) ? Number(body.year) : null;
      language = typeof body?.language === 'string' ? body.language.trim().slice(0, 40) : '';
    } else {
      const u = new URL(req.url);
      title = (u.searchParams.get('title') || '').trim().slice(0, 120);
      const y = Number(u.searchParams.get('year'));
      year = Number.isFinite(y) && y > 1900 ? y : null;
      language = (u.searchParams.get('language') || '').trim().slice(0, 40);
    }

    if (!title) {
      return new Response(JSON.stringify({ error: 'title is required', results: [] }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const queries = [
      `${title} ${year || ''} full movie`,
      `${title} full movie ${language || ''}`,
      `${title} full movie hd`,
    ].map((q) => q.replace(/\s+/g, ' ').trim());

    const collected: Vid[] = [];
    for (const q of queries) {
      const found = await ytSearch(q);
      collected.push(...found);
      const ok = rank(collected, title, year);
      if (ok.length >= 3) break;
    }

    const results = rank(collected, title, year);

    return new Response(JSON.stringify({ count: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (e) {
    console.error('movie-full error:', e);
    return new Response(JSON.stringify({ error: 'An error occurred. Please try again.', results: [] }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
