import { TrendingUp } from "lucide-react";
import SectionHeader from "./SectionHeader";
import type { BoxOffice } from "@/data/movieData";

const statusColors = {
  Blockbuster: "bg-cinema-green/15 text-cinema-green border-cinema-green/30",
  Hit: "bg-primary/15 text-primary border-primary/30",
  Average: "bg-secondary text-muted-foreground border-border",
  Flop: "bg-cinema-red/15 text-cinema-red border-cinema-red/30",
};

const BoxOfficeSection = ({ data }: { data: BoxOffice[] }) => (
  <section>
    <SectionHeader icon="💰" title="Box Office Collection" subtitle="Top 5 earners" />
    <div className="grid gap-2">
      {data.map((m, i) => (
        <div key={m.title} className="glass-card rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary">#{i + 1}</span>
              <h3 className="font-display font-medium text-foreground text-sm">{m.title}</h3>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusColors[m.status]}`}>
              {m.status}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Today: <span className="text-foreground font-medium">{m.todayEarnings}</span>
            </span>
            <span>
              Total: <span className="text-primary font-medium">{m.totalCollection}</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default BoxOfficeSection;
