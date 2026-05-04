import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Bookmark, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchWatchlistDetails, getLocalWatchlistIds, useUserLibrary } from "@/hooks/useUserLibrary";

const Watchlist = () => {
  const { user, loading } = useAuth();
  const { toggleWatchlist, watchlist } = useUserLibrary();
  const [items, setItems] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (user) {
        const rows = await fetchWatchlistDetails(user.id);
        setItems(rows.map((r: any) => ({ id: r.movie_id, ...(r.movie_data || {}) })));
      } else {
        const ids = getLocalWatchlistIds();
        setItems(ids.map((id) => ({ id, title: `Movie #${id}` })));
      }
    })();
  }, [user, watchlist.length]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="w-9 h-9 rounded-lg bg-secondary/60 hover:bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-primary" />
            <h1 className="font-display text-lg font-bold text-gradient-gold">Watch Later</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {!loading && !user && (
          <div className="glass-card rounded-lg p-4 mb-4 text-xs text-muted-foreground">
            <Link to="/auth" className="text-primary underline">Sign in</Link> to sync your watchlist across devices.
          </div>
        )}
        {items.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <Bookmark className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Your watchlist is empty.</p>
            <Link to="/" className="text-xs text-primary underline mt-2 inline-block">Discover movies</Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((it) => (
              <article key={it.id} className="glass-card rounded-xl p-3 flex gap-3 items-center">
                {it.poster && <img src={it.poster} alt={it.title} className="w-14 h-20 object-cover rounded-md" loading="lazy" />}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/movie?title=${encodeURIComponent(it.title || "")}`)}>
                  <h3 className="font-display text-sm font-bold text-foreground truncate">{it.title}</h3>
                  {it.year && <p className="text-[11px] text-muted-foreground">{it.year}</p>}
                </div>
                <button onClick={() => toggleWatchlist(it)} aria-label="Remove" className="p-2 rounded-full hover:bg-cinema-red/10 text-cinema-red">
                  <Trash2 className="w-4 h-4" />
                </button>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Watchlist;