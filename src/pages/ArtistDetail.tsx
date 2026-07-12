import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Music as MusicIcon, Play, User } from "lucide-react";
import { Song, useMusicPlayer } from "@/contexts/MusicPlayerContext";

const ArtistDetail = () => {
  const [params] = useSearchParams();
  const name = (params.get("name") || "").trim();
  const { play, current } = useMusicPlayer();
  const [songs, setSongs] = useState<Song[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement>(null);
  const reqId = useRef(0);

  useEffect(() => {
    document.title = name ? `${name} — All Songs | CineRadar` : "Artist | CineRadar";
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement("meta"); m.setAttribute("name", "description"); document.head.appendChild(m); }
    m.setAttribute("content", `Listen to all songs by ${name || "your favourite singer"}. Background playback, lock-screen controls, auto-next play.`);
  }, [name]);

  useEffect(() => {
    seenRef.current = new Set();
    setSongs([]); setPage(1); setHasMore(true); setError(null);
  }, [name]);

  const loadMore = useCallback(async () => {
    if (!name || loading || !hasMore) return;
    setLoading(true); setError(null);
    const myId = ++reqId.current;
    try {
      const projectId = (import.meta as any).env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY;
      let cursor = page;
      let attempts = 0;
      const added: Song[] = [];
      let serverHasMore = true;
      while (attempts < 4 && added.length === 0) {
        const url = `https://${projectId}.supabase.co/functions/v1/music-feed?q=${encodeURIComponent(name)}&type=songs&page=${cursor}`;
        const res = await fetch(url, { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } });
        const json = await res.json();
        if (myId !== reqId.current) return;
        serverHasMore = json?.hasMore !== false;
        const raw: Song[] = Array.isArray(json?.songs) ? json.songs : [];
        for (const s of raw) {
          if (!s?.videoId || seenRef.current.has(s.videoId)) continue;
          seenRef.current.add(s.videoId);
          added.push(s);
        }
        cursor += 1; attempts += 1;
      }
      if (added.length) setSongs((prev) => [...prev, ...added]);
      setPage(cursor);
      setHasMore(serverHasMore && cursor < 40 && (added.length > 0 || attempts < 4));
    } catch (e: any) {
      if (myId === reqId.current) setError(e?.message || "Failed to load");
    } finally {
      if (myId === reqId.current) setLoading(false);
    }
  }, [name, page, loading, hasMore]);

  useEffect(() => {
    if (songs.length === 0 && hasMore && !loading && name) loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, songs.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) loadMore(); }, { rootMargin: "800px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  const playAll = () => { if (songs.length) play(songs[0], songs); };

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="border-b border-border sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/music" aria-label="Back" className="w-9 h-9 rounded-lg bg-secondary/60 hover:bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center glow-gold">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg font-bold text-gradient-gold leading-tight truncate">{name || "Artist"}</h1>
            <p className="text-[10px] text-muted-foreground">All songs • Auto-play • Background</p>
          </div>
          {songs.length > 0 && (
            <button onClick={playAll} className="h-9 px-3 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 glow-gold">
              <Play className="w-3.5 h-3.5 fill-primary-foreground" /> Play all
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5 space-y-4">
        {!name && (
          <div className="glass-card rounded-lg p-6 text-center text-sm text-muted-foreground">No artist selected.</div>
        )}

        {error && !loading && (
          <div className="bg-cinema-red/10 border border-cinema-red/30 rounded-lg p-3 text-sm text-cinema-red">⚠️ {error}</div>
        )}

        <ul className="divide-y divide-border rounded-lg overflow-hidden border border-border">
          {songs.map((s, i) => {
            const active = current?.videoId === s.videoId;
            return (
              <li key={s.videoId}>
                <button
                  onClick={() => play(s, songs)}
                  className={`w-full flex items-center gap-3 p-2.5 text-left hover:bg-secondary/50 transition ${active ? "bg-secondary/70" : ""}`}
                >
                  <span className="w-6 text-xs font-mono text-muted-foreground shrink-0 text-center">{i + 1}</span>
                  <div className="relative w-16 h-10 rounded overflow-hidden shrink-0 bg-secondary">
                    <img src={s.thumbnail} alt="" loading="lazy" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Play className="w-3.5 h-3.5 text-white fill-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold line-clamp-1 ${active ? "text-primary" : "text-foreground"}`}>{s.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                      <MusicIcon className="w-3 h-3" /> {s.channel}{s.duration ? ` \u2022 ${s.duration}` : ""}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading more songs…
          </div>
        )}

        {!loading && !error && songs.length === 0 && name && (
          <div className="glass-card rounded-lg p-6 text-center text-sm text-muted-foreground">No songs found for this artist.</div>
        )}

        {hasMore && <div ref={sentinelRef} className="h-8" aria-hidden />}
        {!hasMore && songs.length > 0 && (
          <p className="text-center text-[10px] text-muted-foreground py-4">🎵 End of catalogue</p>
        )}
      </main>
    </div>
  );
};

export default ArtistDetail;