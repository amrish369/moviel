import { useNavigate } from "react-router-dom";
import { Tv, Play } from "lucide-react";
import SectionHeader from "./SectionHeader";
import type { OttRelease } from "@/data/movieData";

const platformColors: Record<string, string> = {
  Netflix: "bg-[hsl(0,80%,50%)]/15 text-[hsl(0,80%,50%)]",
  "Prime Video": "bg-[hsl(200,80%,50%)]/15 text-[hsl(200,80%,50%)]",
  Hotstar: "bg-[hsl(210,80%,50%)]/15 text-[hsl(210,80%,50%)]",
};

const OttThisWeek = ({ releases }: { releases: OttRelease[] }) => {
  const navigate = useNavigate();

  return (
    <section>
      <SectionHeader icon="📺" title="OTT This Week" subtitle="Now streaming on your favorite platforms" />
      <div className="grid gap-2">
        {releases.map((r) => (
          <div
            key={r.title}
            onClick={() => navigate(`/movie?title=${encodeURIComponent(r.title)}`)}
            className="glass-card rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-primary/30 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <Play className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-medium text-foreground text-sm">{r.title}</h3>
                <p className="text-xs text-muted-foreground">{r.language} • {r.date}</p>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${platformColors[r.platform] || "bg-secondary text-secondary-foreground"}`}>
              {r.platform}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default OttThisWeek;
