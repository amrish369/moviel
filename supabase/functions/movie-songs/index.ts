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

function scrapeYouTubeSearch(html: string): Song[] {
  // ytInitialData can be assigned via several patterns depending on YT rollout.
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
  // Find the end of the JSON object by walking braces (safer than string search).
  let depth = 0;
  let inStr = false;
  let esc = false;
  let end = -1;
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
    else if (ch === '}') {
      depth--;
      if (depth === 0) { end = i + 1; break; }
    }
  }
  if (end === -1) return [];
  let data: any;
  try {
    data = JSON.parse(html.slice(jsonStart, end));
  } catch {
    return [];
  }

  const songs: Song[] = [];
  const seen = new Set<string>();
  const walk = (node: any) => {
    if (!node || typeof node !== 'object' || songs.length >= 40) return;
    if (Array.isArray(node)) {
      for (const c of node) walk(c);
      return;
    }
    const vr = node.videoRenderer;
    if (vr?.videoId && !seen.has(vr.videoId)) {
      seen.add(vr.videoId);
      const title =
        vr.title?.runs?.map((r: any) => r.text).join('') ||
        vr.title?.simpleText ||
        '';
      const channel =
        vr.ownerText?.runs?.[0]?.text ||
        vr.longBylineText?.runs?.[0]?.text ||
        '';
      const thumbs = vr.thumbnail?.thumbnails || [];
      const thumbnail =
        thumbs[thumbs.length - 1]?.url ||
        `https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`;
      const duration =
        vr.lengthText?.simpleText ||
        vr.lengthText?.accessibility?.accessibilityData?.label ||
        '';
      const views =
        vr.shortViewCountText?.simpleText ||
        vr.viewCountText?.simpleText ||
        '';
      // Filter obvious non-song noise: skip very long items (>15 min) and shorts (<45 s)
      const durSec = parseDurationToSeconds(duration);
      if (durSec == null || (durSec >= 45 && durSec <= 900)) {
        songs.push({ videoId: vr.videoId, title, channel, thumbnail, duration, views });
      }
    }
    for (const key of Object.keys(node)) walk(node[key]);
  };
  walk(data);
  return songs;
}

function parseDurationToSeconds(txt: string): number | null {
  if (!txt) return null;
  const parts = txt.split(':').map((p) => parseInt(p, 10));
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return null;
}

function rankSongs(all: Song[], movieTitle: string): Song[] {
  const t = movieTitle.toLowerCase();
  const filtered = all.filter((s) => {
    const title = s.title.toLowerCase();
    // must plausibly relate to a movie song
    const isSong =
      title.includes('song') ||
      title.includes('video') ||
      title.includes('lyrical') ||
      title.includes('audio') ||
      title.includes('jukebox') ||
      title.includes('ost') ||
      title.includes('theme') ||
      title.includes('bgm') ||
      title.includes('|') ||
      /\bfrom\b/i.test(s.title);
    // ignore reactions/reviews/shorts
    const isNoise =
      title.includes('reaction') ||
      title.includes('review') ||
      title.includes('interview') ||
      title.includes('trailer') ||
      title.includes('teaser') ||
      title.includes('#shorts');
    return isSong && !isNoise;
  });
  // de-dup by normalized title
  const dedup: Song[] = [];
  const seenTitles = new Set<string>();
  for (const s of filtered) {
    const key = s.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
    if (seenTitles.has(key)) continue;
    seenTitles.add(key);
    dedup.push(s);
  }
  // prefer official/T-Series/Sony/Zee/YRF/etc. channels first
  const officialRx = /(t-series|sony music|zee music|yrf|saregama|aditya music|lahari|goldmines|shemaroo|muzik247|think music|divo)/i;
  dedup.sort((a, b) => {
    const ao = officialRx.test(a.channel) ? 1 : 0;
    const bo = officialRx.test(b.channel) ? 1 : 0;
    if (ao !== bo) return bo - ao;
    return 0;
  });
  void t;
  return dedup.slice(0, 20);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const title = url.searchParams.get('title')?.trim();
    const year = url.searchParams.get('year')?.trim() || '';
    if (!title) {
      return new Response(JSON.stringify({ error: 'title is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const q = `${title} ${year} movie all songs jukebox`.trim();
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=EgIQAQ%253D%253D&hl=en&gl=US&persist_hl=1&persist_gl=1`;

    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': YT_UA,
        'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
        'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+000; SOCS=CAI',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `YouTube fetch ${res.status}`, songs: [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const html = await res.text();
    const all = scrapeYouTubeSearch(html);
    const songs = rankSongs(all, title);

    return new Response(
      JSON.stringify({ query: q, count: songs.length, songs }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
        },
      },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), songs: [] }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});