import { useEffect, useState, useCallback } from "react";
import { Loader2, RefreshCw, Star, Tv } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SectionHeader from "./SectionHeader";

type Show = {
  id: number; title: string; overview: string;
  poster: string | null; backdrop: string | null;
  rating: number; language: string;
  firstAirDate: string | null; year: number | null;
};

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

const WebSeriesSection = () => {
  const [released, setReleased] = useState<Show[]>([]);
  const [upcoming, setUpcoming] = useState<Show[]>([]);
  const [tab, setTab] = useState<"released" | "upcoming">("released");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (refresh = false) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("webseries", {
        body: { refresh },
      });
      if (error) throw error;
      setReleased(data?.released || []);
      setUpcoming(data?.upcoming || []);
    } catch (e) {
      console.error("webseries load error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(false); }, [load]);

  const items = tab === "released" ? released : upcoming;

  return (
    <section>
      <div className="flex items-start justify-between gap-3 mb-4">
        <SectionHeader icon="📺" title="Web Series" subtitle="Latest & upcoming Indian web series" />
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="shrink-0 mt-1 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-primary/15 hover:bg-primary/25 text-primary transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
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

      {loading && items.length === 0 ? (
        <div className="glass-card rounded-lg p-8 flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading web series...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card rounded-lg p-6 text-center text-sm text-muted-foreground">
          No {tab} web series found. Try refresh.
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((s) => <ShowCard key={s.id} show={s} upcoming={tab === "upcoming"} />)}
        </div>
      )}
    </section>
  );
};

export default WebSeriesSection;