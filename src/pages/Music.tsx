import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ListMusic, Loader2, Music as MusicIcon, Play, Search, User, X } from "lucide-react";
import { Song, useMusicPlayer } from "@/contexts/MusicPlayerContext";

// Only 4 languages as per requirement.
const CATEGORIES = [
  { id: "trending", label: "🔥 Trending" },
  { id: "hindi", label: "🎬 Hindi" },
  { id: "haryanvi", label: "🌾 Haryanvi" },
  { id: "bhojpuri", label: "🎧 Bhojpuri" },
  { id: "punjabi", label: "🥁 Punjabi" },
];

interface Playlist { playlistId: string; title: string; channel: string; thumbnail: string; videoCount: string; }

const Music = () => {
  const { play, current } = useMusicPlayer();
  const [category, setCategory] = useState("trending");
  const [tab, setTab] = useState<"songs" | "playlists">("songs");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingPlaylistId, setLoadingPlaylistId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const reqId = useRef(0);

  useEffect(() => {
    document.title = "Music — Play Bollywood & South Songs | CineRadar";
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement("meta"); m.setAttribute("name", "description"); document.head.appendChild(m); }
    m.setAttribute("content", "Stream latest Hindi, Haryanvi, Bhojpuri and Punjabi songs. Search singers, browse playlists, background playback with lock-screen controls.");
  }, []);

  const fetchPage = useCallback(async (pageNum: number, opts: { category: string; q: string; tab: "songs" | "playlists" }) => {
    const projectId = (import.meta as any).env.VITE_SUPABASE_PROJECT_ID;
    const anonKey = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const params = new URLSearchParams();
    if (opts.q) params.set("q", opts.q);
    else params.set("category", opts.category);
    params.set("type", opts.tab);
    params.set("page", String(pageNum));
    const url = `https://${projectId}.supabase.co/functions/v1/music-feed?${params.toString()}`;
    const res = await fetch(url, { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } });
    return res.json();
  }, []);

  // Reset + first load when category / query / tab changes
  useEffect(() => {
    seenRef.current = new Set();
    setSongs([]); setPlaylists([]); setPage(1); setHasMore(true); setError(null);
  }, [category, submittedQuery, tab]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true); setError(null);
    const myId = ++reqId.current;
    try {
      let cursor = page;
      let attempts = 0;
      let addedSongs: Song[] = [];
      let addedPlaylists: Playlist[] = [];
      let serverHasMore = true;
      while (attempts < 4 && addedSongs.length === 0 && addedPlaylists.length === 0) {
        const json = await fetchPage(cursor, { category, q: submittedQuery, tab });
        if (myId !== reqId.current) return;
        serverHasMore = json?.hasMore !== false;
        if (tab === "songs") {
          const raw: Song[] = Array.isArray(json?.songs) ? json.songs : [];
          for (const s of raw) {
            if (!s?.videoId || seenRef.current.has(s.videoId)) continue;
            seenRef.current.add(s.videoId);
            addedSongs.push(s);
          }
        } else {
          const raw: Playlist[] = Array.isArray(json?.playlists) ? json.playlists : [];
          for (const p of raw) {
            if (!p?.playlistId || seenRef.current.has(p.playlistId)) continue;
            seenRef.current.add(p.playlistId);
            addedPlaylists.push(p);
          }
        }
        cursor += 1;
        attempts += 1;
      }
      if (addedSongs.length) setSongs((prev) => [...prev, ...addedSongs]);
      if (addedPlaylists.length) setPlaylists((prev) => [...prev, ...addedPlaylists]);
      setPage(cursor);
      // Stop after ~40 pages to be safe.
      setHasMore(serverHasMore && cursor < 40 && (addedSongs.length > 0 || addedPlaylists.length > 0 || attempts < 4));
    } catch (e: any) {
      if (myId === reqId.current) setError(e?.message || "Failed to load");
    } finally {
      if (myId === reqId.current) setLoading(false);
    }
  }, [loading, hasMore, page, category, submittedQuery, tab, fetchPage]);

  // First load whenever list is empty
  useEffect(() => {
    if (songs.length === 0 && playlists.length === 0 && hasMore && !loading) loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songs.length, playlists.length, category, submittedQuery, tab]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) loadMore(); }, { rootMargin: "800px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  const onSearch = (e: React.FormEvent) => { e.preventDefault(); setSubmittedQuery(query.trim()); };
  const clearSearch = () => { setQuery(""); setSubmittedQuery(""); };

  const openPlaylist = useCallback(async (pl: Playlist) => {
    if (loadingPlaylistId) return;
    setLoadingPlaylistId(pl.playlistId);
    try {
      const projectId = (import.meta as any).env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const url = `https://${projectId}.supabase.co/functions/v1/music-feed?playlistId=${encodeURIComponent(pl.playlistId)}`;
      const res = await fetch(url, { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } });
      const json = await res.json();
      const items: Song[] = Array.isArray(json?.songs) ? json.songs : [];
      if (items.length) play(items[0], items);
    } catch {}
    finally { setLoadingPlaylistId(null); }
  }, [loadingPlaylistId, play]);

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="border-b border-border sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" aria-label="Back" className="w-9 h-9 rounded-lg bg-secondary/60 hover:bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center glow-gold">
            <MusicIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-lg font-bold text-gradient-gold leading-tight">Music</h1>
            <p className="text-[10px] text-muted-foreground">Hindi • Haryanvi • Bhojpuri • Punjabi</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5 space-y-5">
        <form onSubmit={onSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search singer, song, movie…"
            className="w-full h-11 pl-10 pr-10 rounded-xl bg-secondary/60 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
          {query && (
            <button type="button" onClick={clearSearch} aria-label="Clear" className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md hover:bg-secondary flex items-center justify-center">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </form>

        {!submittedQuery && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  category === c.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/60 text-foreground border-border hover:border-primary/40"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* Songs / Playlists tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab("songs")}
            className={`flex-1 h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
              tab === "songs" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/60 text-foreground border-border"
            }`}
          >
            <MusicIcon className="w-3.5 h-3.5" /> Songs
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

        {error && !loading && (
          <div className="bg-cinema-red/10 border border-cinema-red/30 rounded-lg p-3 text-sm text-cinema-red">
            ⚠️ {error}
          </div>
        )}

        {tab === "songs" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {songs.map((s) => {
              const active = current?.videoId === s.videoId;
              return (
                <div key={s.videoId} className="text-left group">
                  <button onClick={() => play(s, songs)} className="w-full text-left" aria-label={`Play ${s.title}`}>
                    <div className={`relative aspect-video rounded-lg overflow-hidden bg-secondary/40 ring-2 ${active ? "ring-primary" : "ring-transparent"}`}>
                      <img src={s.thumbnail} alt={s.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-11 h-11 rounded-full bg-primary/90 flex items-center justify-center">
                          <Play className="w-4 h-4 text-primary-foreground fill-primary-foreground ml-0.5" />
                        </div>
                      </div>
                      {s.duration && (
                        <span className="absolute bottom-1 right-1 text-[10px] font-medium text-white bg-black/70 px-1.5 py-0.5 rounded">
                          {s.duration}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs font-semibold text-foreground line-clamp-2">{s.title}</p>
                  </button>
                  {s.channel && (
                    <Link
                      to={`/artist?name=${encodeURIComponent(s.channel.replace(/\s*[-–]\s*topic\s*$/i, ""))}`}
                      className="text-[10px] text-muted-foreground hover:text-primary inline-flex items-center gap-1 truncate max-w-full"
                    >
                      <User className="w-3 h-3" />
                      <span className="truncate">{s.channel}</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "playlists" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading more…
          </div>
        )}

        {!loading && !error && songs.length === 0 && playlists.length === 0 && (
          <div className="glass-card rounded-lg p-6 text-center text-sm text-muted-foreground">
            No results. Try a different search or category.
          </div>
        )}

        {hasMore && <div ref={sentinelRef} className="h-8" aria-hidden />}
        {!hasMore && (songs.length > 0 || playlists.length > 0) && (
          <p className="text-center text-[10px] text-muted-foreground py-4">🎵 You're all caught up</p>
        )}
      </main>
    </div>
  );
};

export default Music;