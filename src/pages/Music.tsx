import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Music as MusicIcon, Play, Search, X } from "lucide-react";
import { Song, useMusicPlayer } from "@/contexts/MusicPlayerContext";

const CATEGORIES = [
  { id: "trending", label: "🔥 Trending" },
  { id: "bollywood", label: "🎬 Bollywood" },
  { id: "tamil", label: "🎧 Tamil" },
  { id: "telugu", label: "🎧 Telugu" },
  { id: "malayalam", label: "🎧 Malayalam" },
  { id: "punjabi", label: "🥁 Punjabi" },
  { id: "romantic", label: "❤️ Romantic" },
  { id: "party", label: "🎉 Party" },
  { id: "lofi", label: "🌙 Lo-fi" },
  { id: "devotional", label: "🕉 Devotional" },
];

const Music = () => {
  const { play, current } = useMusicPlayer();
  const [category, setCategory] = useState("trending");
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Music — Play Bollywood & South Songs | CineRadar";
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement("meta"); m.setAttribute("name", "description"); document.head.appendChild(m); }
    m.setAttribute("content", "Stream latest Bollywood, Tamil, Telugu, Malayalam and Punjabi songs. Video & audio playback with background support.");
  }, []);

  const load = useCallback(async (opts: { category?: string; q?: string }) => {
    setLoading(true); setError(null);
    try {
      const projectId = (import.meta as any).env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const params = new URLSearchParams();
      if (opts.q) params.set("q", opts.q);
      if (opts.category) params.set("category", opts.category);
      const url = `https://${projectId}.supabase.co/functions/v1/music-feed?${params.toString()}`;
      const res = await fetch(url, { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } });
      const json = await res.json();
      setSongs(Array.isArray(json.songs) ? json.songs : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!query.trim()) load({ category });
  }, [category, load, query]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) load({ q: query.trim() });
  };

  const clearSearch = () => { setQuery(""); load({ category }); };

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
            <p className="text-[10px] text-muted-foreground">Bollywood • South • Punjabi — video & audio</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5 space-y-5">
        <form onSubmit={onSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search song, artist, movie…"
            className="w-full h-11 pl-10 pr-10 rounded-xl bg-secondary/60 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
          {query && (
            <button type="button" onClick={clearSearch} aria-label="Clear" className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md hover:bg-secondary flex items-center justify-center">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </form>

        {!query && (
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

        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading songs from YouTube…
          </div>
        )}

        {error && !loading && (
          <div className="bg-cinema-red/10 border border-cinema-red/30 rounded-lg p-3 text-sm text-cinema-red">
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && songs.length === 0 && (
          <div className="glass-card rounded-lg p-6 text-center text-sm text-muted-foreground">
            No songs found. Try a different search or category.
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {songs.map((s) => {
            const active = current?.videoId === s.videoId;
            return (
              <button
                key={s.videoId}
                onClick={() => play(s, songs)}
                className="text-left group"
                aria-label={`Play ${s.title}`}
              >
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
                <p className="text-[10px] text-muted-foreground truncate">{s.channel}</p>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Music;