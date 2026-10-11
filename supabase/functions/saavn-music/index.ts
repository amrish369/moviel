import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import CryptoJS from 'npm:crypto-js@4.2.0';

const cache = new Map<string, { at: number; body: string }>();
const CAT_QUERY: Record<string, string> = {
  trending: 'latest hindi songs',
  hindi: 'bollywood hits',
  haryanvi: 'haryanvi songs',
  bhojpuri: 'bhojpuri songs',
  punjabi: 'punjabi songs',
};
const KEY = CryptoJS.enc.Utf8.parse('38346591');
const decrypt = (enc: string) => {
  try {
    const out = CryptoJS.DES.decrypt({ ciphertext: CryptoJS.enc.Base64.parse(enc) } as any, KEY, {
      mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7,
    }).toString(CryptoJS.enc.Utf8);
    return out.replace('_96.mp4', '_160.mp4').replace('http://', 'https://');
  } catch { return ''; }
};
const unesc = (s: string) => (s || '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'");
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const json = (b: unknown) => new Response(typeof b === 'string' ? b : JSON.stringify(b), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  try {
    const u = new URL(req.url);
    const q = (u.searchParams.get('q') || '').slice(0, 100).trim();
    const cat = (u.searchParams.get('category') || 'trending').replace(/[^a-z]/g, '');
    const page = Math.max(1, Math.min(100, parseInt(u.searchParams.get('page') || '1', 10) || 1));
    const query = q || CAT_QUERY[cat] || CAT_QUERY.trending;
    const key = `${query}|${page}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < 3 * 3600_000) return json(hit.body);
    const p = new URLSearchParams({ __call: 'search.getResults', _format: 'json', _marker: '0', api_version: '4', ctx: 'web6dot0', n: '30', p: String(page), q: query });
    const LANG: Record<string, string> = { trending: 'hindi', hindi: 'hindi', haryanvi: 'haryanvi', bhojpuri: 'bhojpuri', punjabi: 'punjabi' };
    let list: any[] = [];
    let source = 'saavn';
    // Page 1 of a category = JioSaavn's live trending chart (real rank order).
    if (!q && page === 1 && LANG[cat]) {
      const tp = new URLSearchParams({ __call: 'content.getTrending', _format: 'json', _marker: '0', api_version: '4', ctx: 'web6dot0', entity_type: 'song', entity_language: LANG[cat] });
      try {
        const tr = await fetch(`https://www.jiosaavn.com/api.php?${tp}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const tj = await tr.json();
        if (Array.isArray(tj)) { list = tj; source = 'saavn-trending'; }
      } catch { /* fall back to search */ }
    }
    if (!list.length) {
      const r = await fetch(`https://www.jiosaavn.com/api.php?${p}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const j = await r.json();
      list = j?.results || [];
    }
    const songs = list.map((t: any) => {
      const mi = t.more_info || {};
      const audio = mi.encrypted_media_url ? decrypt(mi.encrypted_media_url) : '';
      if (!audio) return null;
      const artists = (mi.artistMap?.primary_artists || []).map((a: any) => unesc(a.name)).join(', ');
      return {
        videoId: `sv_${t.id}`,
        title: unesc(t.title),
        channel: artists || unesc(mi.music || t.subtitle || ''),
        thumbnail: (t.image || '').replace('150x150', '500x500'),
        duration: mi.duration ? fmt(parseInt(mi.duration, 10)) : '',
        audioUrl: audio,
        downloadUrl: audio,
      };
    }).filter(Boolean);
    const body = JSON.stringify({ songs, hasMore: songs.length >= 15, source });
    if (songs.length) cache.set(key, { at: Date.now(), body });
    return json(body);
  } catch (e) {
    console.log('saavn err', String(e));
    return json({ songs: [], hasMore: false, error: 'Unable to load songs' });
  }
});
