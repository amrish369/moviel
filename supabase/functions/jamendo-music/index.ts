import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const cache = new Map<string, { at: number; body: string }>();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const u = new URL(req.url);
    const q = (u.searchParams.get('q') || '').slice(0, 100).trim();
    const tag = (u.searchParams.get('tag') || '').replace(/[^a-z0-9+ ]/gi, '').slice(0, 40);
    const page = Math.max(1, Math.min(200, parseInt(u.searchParams.get('page') || '1', 10) || 1));
    const limit = 30;
    const key = `${q}|${tag}|${page}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < 6 * 3600_000) {
      return new Response(hit.body, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const clientId = Deno.env.get('JAMENDO_CLIENT_ID');
    if (!clientId) throw new Error('missing key');
    const p = new URLSearchParams({
      client_id: clientId, format: 'json', limit: String(limit), offset: String((page - 1) * limit),
      audioformat: 'mp32', include: 'musicinfo', imagesize: '300',
      order: 'popularity_total',
    });
    if (q) { p.set('namesearch', q); p.delete('order'); }
    if (tag) p.set('tags', tag);
    const r = await fetch(`https://api.jamendo.com/v3.0/tracks/?${p}`);
    const j = await r.json();
    const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const songs = (j?.results || []).filter((t: any) => t.audio).map((t: any) => ({
      videoId: `jm_${t.id}`,
      title: t.name,
      channel: t.artist_name,
      thumbnail: t.image || t.album_image,
      duration: t.duration ? fmt(t.duration) : '',
      audioUrl: t.audio,
      downloadUrl: t.audiodownload_allowed ? t.audiodownload : t.audio,
    }));
    const body = JSON.stringify({ songs, hasMore: songs.length >= limit - 5, source: 'jamendo' });
    if (songs.length) cache.set(key, { at: Date.now(), body });
    return new Response(body, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.log('jamendo err', String(e));
    return new Response(JSON.stringify({ songs: [], hasMore: false, error: 'Unable to load songs' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
