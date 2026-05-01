import { CalendarDays } from "lucide-react";
import SectionHeader from "./SectionHeader";
import type { Upcoming } from "@/data/movieData";

const hypeColors = {
  High: "text-cinema-green bg-cinema-green/10",
  Medium: "text-primary bg-primary/10",
  Low: "text-muted-foreground bg-secondary",
};

const UpcomingMovies = ({ movies, monthLabel }: { movies: Upcoming[]; monthLabel?: string }) => (
  <section>
    <SectionHeader
      icon="📅"
      title={monthLabel ? `Coming in ${monthLabel}` : "Upcoming Movies"}
      subtitle="Indian releases scheduled next month"
    />
    <div className="grid gap-2">
      {movies.map((m) => (
        <div key={m.title} className="glass-card rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <h3 className="font-display font-medium text-foreground text-sm">{m.title}</h3>
              <p className="text-xs text-muted-foreground">{m.releaseDate} • {m.category}</p>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${hypeColors[m.hype]}`}>
            {m.hype} Hype
          </span>
        </div>
      ))}
    </div>
  </section>
);

export default UpcomingMovies;
