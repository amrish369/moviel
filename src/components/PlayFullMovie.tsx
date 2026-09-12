import { useState } from "react";
import { Loader2, PlayCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FullResult {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  views: string;
}

const cache = new Map<string, FullResult[]>();

const PlayFullMovie = ({
  title,
  year,
  language,
  className = "",
}: {
  title: string;
  year?: number | null;
  language?: string;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FullResult[]>([]);
  const [active, setActive] = useState<FullResult | null>(null);
  const [searched, setSearched] = useState(false);

  const cacheKey = `${title}|${year ?? ""}`;

  const start = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
    if (searched) return;
    const cached = cache.get(cacheKey);
    if (cached) {
      setResults(cached);
      setActive(cached[0] ?? null);
      setSearched(true);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("movie-full", {
        body: { title, year, language },
      });
      if (error) throw error;
      const list: FullResult[] = data?.results || [];
      cache.set(cacheKey, list);
      setResults(list);
      setActive(list[0] ?? null);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  return (
    <>
      <button
        onClick={start}
        aria-label="Play full movie"
        className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-colors ${className}`}
      >
        <PlayCircle className="w-3 h-3" />
        Play Full Movie
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] bg-background/95 backdrop-blur-xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3 p-3 border-b border-border">
            <p className="text-sm font-bold text-foreground truncate">{title}{year ? ` (${year})` : ""}</p>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); }}
              aria-label="Close"
              className="w-9 h-9 rounded-full bg-secondary/60 hover:bg-secondary flex items-center justify-center shrink-0"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <p className="text-xs text-muted-foreground">YouTube par full movie dhoondh rahe hain…</p>
              </div>
            )}

            {!loading && active && (
              <div className="w-full max-w-3xl mx-auto space-y-3">
                <div className="aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
                  <iframe
                    key={active.videoId}
                    src={`https://www.youtube.com/embed/${active.videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`}
                    title={active.title}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground line-clamp-2">{active.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {active.channel}{active.duration ? ` • ${active.duration}` : ""}{active.views ? ` • ${active.views}` : ""}
                  </p>
                </div>
              </div>
            )}

            {!loading && results.length > 1 && (
              <div className="w-full max-w-3xl mx-auto">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Other versions
                </h3>
                <ul className="divide-y divide-border rounded-xl overflow-hidden border border-border">
                  {results.map((r) => (
                    <li key={r.videoId}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setActive(r); }}
                        className={`w-full flex items-center gap-3 p-2.5 text-left hover:bg-secondary/60 transition ${
                          active?.videoId === r.videoId ? "bg-secondary/70" : ""
                        }`}
                      >
                        <img src={r.thumbnail} alt="" loading="lazy" className="w-16 h-10 rounded object-cover shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground line-clamp-1">{r.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {r.channel}{r.duration ? ` • ${r.duration}` : ""}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!loading && searched && results.length === 0 && (
              <div className="py-16 text-center space-y-2">
                <p className="text-sm font-semibold text-foreground">Full movie YouTube par nahi mili</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Is movie ki poori film YouTube par publicly available nahi hai. Trailer dekhne ke liye movie page kholein
                  ya Telegram option try karein.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PlayFullMovie;
