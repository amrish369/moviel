import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ListMusic, Loader2, Music as MusicIcon, Play, User } from "lucide-react";
import { Song, useMusicPlayer } from "@/contexts/MusicPlayerContext";

interface Playlist { playlistId: string; title: string; channel: string; thumbnail: string; videoCount: string; }
interface Bio { photo?: string; extract?: string; url?: string; }

const ArtistDetail = () => {
  const [params] = useSearchParams();
  const name = (params.get("name") || "").trim();
  const { play, current } = useMusicPlayer();
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadingPlaylistId, setLoadingPlaylistId] = useState<string | null>(null);
  const [bio, setBio] = useState<Bio | null>(null);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [tab, setTab] = useState<"songs" | "playlists">("songs");
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
    setSongs([]); setPlaylists([]); setPage(1); setHasMore(true); setError(null); setBio(null); setBioExpanded(false);
  }, [name]);

  // Fetch artist bio + photo from Wikipedia REST (CORS-enabled, no key needed).
  useEffect(() => {
    if (!name) return;
    let aborted = false;
    const tryFetch = async (title: string): Promise<Bio | null> => {
      try {
        const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`);
        if (!r.ok) return null;
        const j = await r.json();
        if (j?.type === "disambiguation") return null;
        return {
          photo: j?.thumbnail?.source || j?.originalimage?.source,
          extract: j?.extract,
          url: j?.content_urls?.desktop?.page,
        };
      } catch { return null; }
    };
    (async () => {
      // Try "<name> (singer)" first for better disambiguation, fall back to plain name.
      const cleaned = name.replace(/\s*[-–]\s*topic\s*$/i, "").trim();
      const b = (await tryFetch(`${cleaned} (singer)`)) || (await tryFetch(cleaned));
      if (!aborted && b?.extract) setBio(b);
    })();
    return () => { aborted = true; };
  }, [name]);

  // Load a small batch of playlists for this artist (lazy — first time user opens the tab).
  const loadPlaylists = useCallback(async () => {
    if (!name || playlists.length > 0) return;
    try {
      const projectId = (import.meta as any).env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const found: Playlist[] = [];
      const seen = new Set<string>();
      for (let p = 1; p <= 3 && found.length < 20; p++) {
        const url = `https://${projectId}.supabase.co/functions/v1/music-feed?q=${encodeURIComponent(name)}&type=playlists&page=${p}`;
        const res = await fetch(url, { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } });
        const json = await res.json();
        const raw: Playlist[] = Array.isArray(json?.playlists) ? json.playlists : [];
        for (const pl of raw) {
          if (!pl?.playlistId || seen.has(pl.playlistId)) continue;
          seen.add(pl.playlistId);
          found.push(pl);
        }
      }
      setPlaylists(found);
    } catch {}
  }, [name, playlists.length]);

  useEffect(() => { if (tab === "playlists") loadPlaylists(); }, [tab, loadPlaylists]);

  const openPlaylist = useCallback(async (pl: Playlist) => {
    if (loadingPlaylistId) return;
    setLoadingPlaylistId(pl.playlistId);
    try {
      const projectId = (import.meta as any).env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const url = `https://${projectId}.supabase.co/functions/v1/music-feed?playlistId=${encodeURIComponent(pl.playlistId)}&fresh=${Date.now()}`;
      const res = await fetch(url, { cache: "no-store", headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } });
      const json = await res.json();
      const items: Song[] = Array.isArray(json?.songs) ? json.songs : [];
      if (items.length) play(items[0], items);
    } catch {} finally { setLoadingPlaylistId(null); }
  }, [loadingPlaylistId, play]);

  const loadMore = useCallback(async () => {
    if (!name || loading || !hasMore || tab !== "songs") return;
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
  }, [name, page, loading, hasMore, tab]);

  useEffect(() => {
    if (tab === "songs" && songs.length === 0 && hasMore && !loading && name) loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, songs.length, tab]);

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

        {name && (
          <section className="glass-card rounded-2xl p-4 flex gap-4 items-start">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-secondary ring-2 ring-primary/40">
              {bio?.photo ? (
                <img src={bio.photo} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <User className="w-8 h-8 text-primary" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl font-bold text-foreground truncate">{name}</h2>
              {bio?.extract ? (
                <>
                  <p className={`text-xs text-muted-foreground mt-1 ${bioExpanded ? "" : "line-clamp-3"}`}>{bio.extract}</p>
                  <button onClick={() => setBioExpanded((v) => !v)} className="text-[10px] font-semibold text-primary mt-1">
                    {bioExpanded ? "Show less" : "Read more"}
                  </button>
                </>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">Singer • All songs, playlists and hits below.</p>
              )}
            </div>
          </section>
        )}

        {name && (
          <div className="flex gap-2">
            <button
              onClick={() => setTab("songs")}
              className={`flex-1 h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                tab === "songs" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/60 text-foreground border-border"
              }`}
            >
              <MusicIcon className="w-3.5 h-3.5" /> All Songs
            </button>
            <button
              onClick={() => setTab("playlists")}
              className={`flex-1 h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                tab === "playlists" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/60 text-foreground border-border"
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" /> Playlists
            </button>
          </div>
        )}

        {error && !loading && (
          <div className="bg-cinema-red/10 border border-cinema-red/30 rounded-lg p-3 text-sm text-cinema-red">⚠️ {error}</div>
        )}

        {tab === "songs" && (
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
        )}

        {tab === "playlists" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {playlists.map((p) => {
              const busy = loadingPlaylistId === p.playlistId;
              return (
                <button key={p.playlistId} onClick={() => openPlaylist(p)} className="text-left group" aria-label={`Play playlist ${p.title}`}>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary/40 ring-2 ring-transparent">
                    <img src={p.thumbnail} alt={p.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-1 right-1 text-[10px] font-medium text-white bg-black/70 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <ListMusic className="w-3 h-3" /> {p.videoCount || "playlist"}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-11 h-11 rounded-full bg-primary/90 flex items-center justify-center">
                        {busy ? <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" /> : <Play className="w-4 h-4 text-primary-foreground fill-primary-foreground ml-0.5" />}
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-foreground line-clamp-2">{p.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{p.channel}</p>
                </button>
              );
            })}
            {playlists.length === 0 && (
              <div className="col-span-full glass-card rounded-lg p-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading playlists…
              </div>
            )}
          </div>
        )}

        {tab === "songs" && loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading more songs…
          </div>
        )}

        {tab === "songs" && !loading && !error && songs.length === 0 && name && (
          <div className="glass-card rounded-lg p-6 text-center text-sm text-muted-foreground">No songs found for this artist.</div>
        )}

        {tab === "songs" && hasMore && <div ref={sentinelRef} className="h-8" aria-hidden />}
        {tab === "songs" && !hasMore && songs.length > 0 && (
          <p className="text-center text-[10px] text-muted-foreground py-4">🎵 End of catalogue</p>
        )}
      </main>
    </div>
  );
};

export default ArtistDetail;