import { useEffect, useRef, useState } from "react";
import { Loader2, Music, Play, X } from "lucide-react";

interface Song {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  views: string;
}

const MovieSongsReel = ({ title, year }: { title: string; year?: number | string }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Song | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!title) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const projectId = (import.meta as any).env.VITE_SUPABASE_PROJECT_ID;
        const anonKey = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const url = `https://${projectId}.supabase.co/functions/v1/movie-songs?title=${encodeURIComponent(title)}&year=${encodeURIComponent(String(year || ""))}`;
        const res = await fetch(url, {
          headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
          signal: ac.signal,
        });
        const json = await res.json();
        if (ac.signal.aborted) return;
        setSongs(Array.isArray(json.songs) ? json.songs : []);
      } catch (e: any) {
        if (!ac.signal.aborted) setError(e?.message || "Failed to load songs");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [title, year]);

  if (loading) {
    return (
      <section className="glass-card rounded-xl p-5 space-y-3">
        <h2 className="font-display font-bold text-foreground flex items-center gap-2">
          <Music className="w-4 h-4 text-primary" /> Songs
        </h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Fetching songs from YouTube…
        </div>
      </section>
    );
  }

  if (error || songs.length === 0) return null;

  return (
    <section className="glass-card rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-foreground flex items-center gap-2">
          <Music className="w-4 h-4 text-primary" /> Songs from {title}
        </h2>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {songs.length} tracks
        </span>
      </div>

      <div className="-mx-5 px-5 overflow-x-auto no-scrollbar">
        <div className="flex gap-3 snap-x snap-mandatory">
          {songs.map((s) => (
            <button
              key={s.videoId}
              onClick={() => setActive(s)}
              className="snap-start shrink-0 w-40 text-left group"
              aria-label={`Play ${s.title}`}
            >
              <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary/40">
                <img
                  src={s.thumbnail}
                  alt={s.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
                    <Play className="w-4 h-4 text-background fill-background" />
                  </div>
                </div>
                {s.duration && (
                  <span className="absolute bottom-1 right-1 text-[10px] font-medium text-white bg-black/70 px-1.5 py-0.5 rounded">
                    {s.duration}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs font-medium text-foreground line-clamp-2">
                {s.title}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{s.channel}</p>
            </button>
          ))}
        </div>
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActive(null)}
        >
          <button
            onClick={() => setActive(null)}
            aria-label="Close song"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
          <div
            className="w-full max-w-4xl aspect-video rounded-xl overflow-hidden bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${active.videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title={active.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/90 text-sm max-w-[80%] text-center line-clamp-2">
            {active.title}
          </p>
        </div>
      )}
    </section>
  );
};

export default MovieSongsReel;