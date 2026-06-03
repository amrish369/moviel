import { useState } from "react";
import { Loader2, Star, Tv } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SectionHeader from "./SectionHeader";
import { useSectionFeed, type SectionItem } from "@/hooks/useSectionFeed";

type Show = SectionItem;

const ShowCard = ({ show, upcoming }: { show: Show; upcoming?: boolean }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/movie?title=${encodeURIComponent(show.title)}`)}
      className="glass-card rounded-lg p-3 hover:border-primary/30 transition-all cursor-pointer active:scale-[0.98] flex gap-3"
    >
      {show.poster ? (
        <img src={show.poster} alt={show.title} loading="lazy"
          className="w-20 h-28 object-cover rounded-md shrink-0" />
      ) : (
        <div className="w-20 h-28 rounded-md bg-secondary flex items-center justify-center shrink-0">
          <Tv className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-foreground truncate">{show.title}</h3>
          <span className="flex items-center gap-1 shrink-0 text-xs font-bold text-primary">
            <Star className="w-3 h-3 fill-primary" /> {show.rating || "—"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
          <span>{show.language}</span>
          {show.firstAirDate && <><span>•</span><span>{show.firstAirDate}</span></>}
          {upcoming && <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-semibold">UPCOMING</span>}
        </div>
        {show.overview && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">{show.overview}</p>
        )}
      </div>
    </div>
  );
};

const WebSeriesSection = ({ mood, category }: { mood?: string; category?: string }) => {
  const [tab, setTab] = useState<"released" | "upcoming">("released");
  const section = tab === "released" ? "webseries-released" : "webseries-upcoming";
  const { items, loading, hasMore, error, sentinelRef, loadMore } =
    useSectionFeed(section, mood, category);

  return (
    <section>
      <div className="flex items-start justify-between gap-3 mb-4">
        <SectionHeader icon="📺" title="Web Series" subtitle="Latest & upcoming Indian web series" />
      </div>

      <div className="flex gap-2 mb-4">
        {(["released", "upcoming"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {t === "released" ? "Released" : "Upcoming"}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {items.map((s) => <ShowCard key={s.id} show={s} upcoming={tab === "upcoming"} />)}
      </div>
      <div ref={sentinelRef} className="py-6 flex items-center justify-center">
        {loading && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
        {!loading && hasMore && items.length > 0 && (
          <p className="text-[11px] text-muted-foreground">Scroll for more…</p>
        )}
        {!loading && items.length === 0 && !error && (
          <div className="glass-card rounded-lg p-6 text-center text-sm text-muted-foreground w-full">
            No {tab} web series for these filters.
          </div>
        )}
        {error && !loading && (
          <button onClick={loadMore} className="text-xs text-primary underline">Retry</button>
        )}
      </div>
    </section>
  );
};

export default WebSeriesSection;