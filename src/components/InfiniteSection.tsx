import { Loader2, Star, CalendarDays, TrendingUp, Play, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSectionFeed, type SectionItem } from "@/hooks/useSectionFeed";
import SectionHeader from "./SectionHeader";
import MoviePoster from "./MoviePoster";
import DownloadButton from "./DownloadButton";

type Props = {
  section: "daily" | "today" | "ott" | "upcoming" | "reviews" | "boxoffice" | "trending-india" | "trending-worldwide";
  mood?: string;
  category?: string;
  title: string;
  icon: string;
  subtitle?: string;
};

const verdict = (r: number) => r >= 7 ? "Watch" : r >= 5 ? "OTT Wait" : "Skip";
const verdictColors: Record<string, string> = {
  Watch: "bg-cinema-green/15 text-cinema-green",
  Skip: "bg-cinema-red/15 text-cinema-red",
  "OTT Wait": "bg-primary/15 text-primary",
};
const status = (rating: number) => rating >= 8 ? "Blockbuster" : rating >= 7 ? "Hit" : rating >= 5.5 ? "Average" : "Flop";
const statusColors: Record<string, string> = {
  Blockbuster: "bg-cinema-green/15 text-cinema-green border-cinema-green/30",
  Hit: "bg-primary/15 text-primary border-primary/30",
  Average: "bg-secondary text-muted-foreground border-border",
  Flop: "bg-cinema-red/15 text-cinema-red border-cinema-red/30",
};
const hype = (p: number) => p > 50 ? "High" : p > 15 ? "Medium" : "Low";
const hypeColors: Record<string, string> = {
  High: "text-cinema-green bg-cinema-green/10",
  Medium: "text-primary bg-primary/10",
  Low: "text-muted-foreground bg-secondary",
};

const fmtRevenue = (r: number) => r >= 1_000_000 ? `$${(r / 1_000_000).toFixed(1)}M` : r > 0 ? `$${r}` : "N/A";

const InfiniteSection = ({ section, mood, category, title, icon, subtitle }: Props) => {
  const navigate = useNavigate();
  const { items, loading, hasMore, error, sentinelRef, loadMore } =
    useSectionFeed(section, mood, category);

  const go = (t: string) => navigate(`/movie?title=${encodeURIComponent(t)}`);

  const renderItem = (it: SectionItem, i: number) => {
    if (section === "daily" || section === "ott") {
      return (
        <div
          key={it.id}
          onClick={() => go(it.title)}
          className="glass-card rounded-lg p-4 hover:border-primary/30 transition-all group cursor-pointer active:scale-[0.98]"
        >
          <div className="flex items-start gap-3">
            <MoviePoster title={it.title} year={it.year || undefined} genre={it.category} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">#{i + 1}</span>
                    <h3 className="font-display font-semibold text-foreground truncate group-hover:text-primary transition-colors">{it.title}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span>{it.year || "—"}</span>
                    <span>•</span>
                    <span>{it.language}</span>
                    <span>•</span>
                    <span>{it.category}</span>
                  </div>
                  {it.overview && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{it.overview}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded">
                    <Star className="w-3 h-3 text-primary fill-primary" />
                    <span className="text-sm font-bold text-primary">{it.rating || "—"}</span>
                  </div>
                  <DownloadButton movieTitle={it.title} />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (section === "today") {
      return (
        <div
          key={it.id}
          onClick={() => go(it.title)}
          className="glass-card rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-primary/30 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <Play className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-medium text-foreground text-sm truncate hover:text-primary transition-colors">{it.title}</h3>
              <p className="text-xs text-muted-foreground truncate">{it.language} • {it.releaseDateRaw || "—"}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 rounded bg-primary/10 text-primary shrink-0 ml-2">{it.category}</span>
        </div>
      );
    }

    if (section === "upcoming") {
      const dateObj = it.releaseDateRaw ? new Date(it.releaseDateRaw) : null;
      const releaseDate = dateObj
        ? dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "TBA";
      const h = hype(it.popularity || 0);
      return (
        <div
          key={it.id}
          onClick={() => go(it.title)}
          className="glass-card rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-primary/30 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <h3 className="font-display font-medium text-foreground text-sm truncate">{it.title}</h3>
              <p className="text-xs text-muted-foreground truncate">{releaseDate} • {it.category}</p>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shrink-0 ml-2 ${hypeColors[h]}`}>
            {h} Hype
          </span>
        </div>
      );
    }

    if (section === "reviews") {
      const v = verdict(it.rating || 0);
      return (
        <div
          key={it.id}
          onClick={() => go(it.title)}
          className="glass-card rounded-lg p-4 space-y-2 cursor-pointer hover:border-primary/30 transition-all"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display font-semibold text-foreground truncate">{it.title}</h3>
            <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${verdictColors[v]}`}>
              {v === "Watch" ? "🎯" : v === "Skip" ? "❌" : "⏳"} {v}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{it.overview || "No synopsis available."}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 text-primary">
              <Star className="w-3 h-3 fill-primary" /> {it.rating || "—"}
            </span>
            <span>•</span>
            <span>{it.voteCount || 0} votes</span>
            <span>•</span>
            <span>{it.language}</span>
          </div>
        </div>
      );
    }

    if (section === "boxoffice") {
      const s = status(it.rating || 0);
      return (
        <div
          key={it.id}
          onClick={() => go(it.title)}
          className="glass-card rounded-lg p-3 cursor-pointer hover:border-primary/30 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold text-primary shrink-0">#{i + 1}</span>
              <h3 className="font-display font-medium text-foreground text-sm truncate">{it.title}</h3>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ml-2 ${statusColors[s]}`}>
              {s}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {it.language}
            </span>
            <span>
              Worldwide: <span className="text-primary font-medium">{fmtRevenue(it.revenue || 0)}</span>
            </span>
          </div>
        </div>
      );
    }

    if (section === "trending-india" || section === "trending-worldwide") {
      return (
        <div
          key={it.id}
          onClick={() => go(it.title)}
          className="glass-card rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:border-primary/30 transition-all active:scale-[0.98]"
        >
          <span className="text-xs font-bold text-primary w-7 text-right shrink-0">#{i + 1}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-medium text-foreground text-sm truncate hover:text-primary transition-colors">{it.title}</h3>
            <p className="text-xs text-muted-foreground truncate">{it.language} • {it.category}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Flame className="w-3 h-3 text-accent" />
            <span className="text-xs text-primary font-bold">{it.rating || "—"}</span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <section className="scroll-mt-24">
      <SectionHeader icon={icon} title={title} subtitle={subtitle} />
      <div className="grid gap-2.5">
        {items.map(renderItem)}
      </div>
      <div ref={sentinelRef} className="py-6 flex items-center justify-center">
        {loading && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
        {!loading && !hasMore && items.length > 0 && (
          <p className="text-xs text-muted-foreground">You're all caught up ✨</p>
        )}
        {!loading && items.length === 0 && !error && (
          <p className="text-xs text-muted-foreground">No items match your filters yet.</p>
        )}
        {error && !loading && (
          <button onClick={loadMore} className="text-xs text-primary underline">Retry</button>
        )}
      </div>
    </section>
  );
};

export default InfiniteSection;