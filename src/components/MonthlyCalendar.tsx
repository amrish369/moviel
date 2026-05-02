import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2, CalendarRange, Film, Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SectionHeader from "./SectionHeader";

type CalMovie = {
  id: number;
  title: string;
  releaseDate: string;
  poster: string | null;
  rating: number;
  voteCount: number;
  overview: string;
  language: string;
  popularity: number;
};

type CategoryBlock = {
  key: string;
  label: string;
  total: number;
  releasedCount: number;
  upcomingCount: number;
  released: CalMovie[];
  upcoming: CalMovie[];
};

type CalData = {
  year: number;
  month: number;
  monthLabel: string;
  isPast: boolean;
  total: number;
  categories: CategoryBlock[];
};

const CAT_COLORS: Record<string, string> = {
  Bollywood: "text-amber-300 bg-amber-300/10 border-amber-300/30",
  South: "text-emerald-300 bg-emerald-300/10 border-emerald-300/30",
  Regional: "text-sky-300 bg-sky-300/10 border-sky-300/30",
  Hollywood: "text-rose-300 bg-rose-300/10 border-rose-300/30",
};

function fmtDate(d: string) {
  if (!d) return "TBA";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const MovieRow = ({ m, onClick }: { m: CalMovie; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/60 transition-colors text-left"
  >
    <div className="w-10 h-14 rounded bg-secondary overflow-hidden shrink-0">
      {m.poster ? (
        <img src={m.poster} alt={m.title} loading="lazy" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Film className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
      <p className="text-[11px] text-muted-foreground">
        {fmtDate(m.releaseDate)} • {m.language?.toUpperCase()}
        {m.rating > 0 && ` • ⭐ ${m.rating}`}
      </p>
    </div>
  </button>
);

const MonthlyCalendar = () => {
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [data, setData] = useState<CalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<string>("Bollywood");
  const [view, setView] = useState<"upcoming" | "released">("upcoming");

  const load = useCallback(async (y: number, m: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: fnErr } = await supabase.functions.invoke("monthly-calendar", {
        body: { year: y, month: m },
      });
      if (fnErr) throw fnErr;
      if (res?.error) throw new Error(res.error);
      setData(res as CalData);
      // Auto-pick view: if month is past, show released
      const today = new Date();
      const isPastMonth = y < today.getFullYear() || (y === today.getFullYear() && m < today.getMonth() + 1);
      setView(isPastMonth ? "released" : "upcoming");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load calendar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(year, month); }, [year, month, load]);

  const shift = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setYear(y);
    setMonth(m);
  };

  const active = data?.categories.find((c) => c.key === activeCat);
  const list = active ? (view === "released" ? active.released : active.upcoming) : [];

  return (
    <section>
      <SectionHeader
        icon="🗓️"
        title="Monthly Movie Calendar"
        subtitle="Browse releases & upcoming by category"
      />

      {/* Month navigator */}
      <div className="glass-card rounded-xl p-3 mb-3 flex items-center justify-between">
        <button
          onClick={() => shift(-1)}
          className="w-9 h-9 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <CalendarRange className="w-4 h-4 text-primary" />
          <span className="font-display font-bold text-foreground">
            {data?.monthLabel || "Loading..."}
          </span>
        </div>
        <button
          onClick={() => shift(1)}
          className="w-9 h-9 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Category chips with counts */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {(data?.categories || []).map((c) => {
          const isActive = c.key === activeCat;
          return (
            <button
              key={c.key}
              onClick={() => setActiveCat(c.key)}
              className={`rounded-lg p-2.5 border text-left transition-all ${
                isActive
                  ? CAT_COLORS[c.key] + " ring-1 ring-current/40"
                  : "border-border bg-card/40 text-muted-foreground hover:bg-card"
              }`}
            >
              <div className="text-xs font-bold uppercase tracking-wider">{c.label}</div>
              <div className="text-[11px] mt-0.5 opacity-80">
                {c.total} total • {c.releasedCount} released • {c.upcomingCount} upcoming
              </div>
            </button>
          );
        })}
      </div>

      {/* Released / Upcoming toggle */}
      {active && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setView("upcoming")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              view === "upcoming"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Upcoming ({active.upcomingCount})
          </button>
          <button
            onClick={() => setView("released")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              view === "released"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Released ({active.releasedCount})
          </button>
        </div>
      )}

      {/* Movie list */}
      <div className="glass-card rounded-xl p-2 min-h-[120px]">
        {loading && (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading {data?.monthLabel || "month"}...</span>
          </div>
        )}
        {!loading && error && (
          <div className="p-4 text-sm text-cinema-red">⚠️ {error}</div>
        )}
        {!loading && !error && list.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No {view} {active?.label} movies for this month.
          </div>
        )}
        {!loading && !error && list.length > 0 && (
          <div className="divide-y divide-border/40">
            {list.map((m) => (
              <MovieRow
                key={m.id}
                m={m}
                onClick={() => navigate(`/movie?title=${encodeURIComponent(m.title)}`)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default MonthlyCalendar;