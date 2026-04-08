import SectionHeader from "./SectionHeader";
import type { Release } from "@/data/movieData";

const TodayReleases = ({ releases }: { releases: Release[] }) => (
  <section>
    <SectionHeader icon="🆕" title="Today's Releases" subtitle="April 8, 2026" />
    {releases.length === 0 ? (
      <p className="text-muted-foreground text-sm glass-card rounded-lg p-4">No major releases today</p>
    ) : (
      <div className="grid gap-2">
        {releases.map((r) => (
          <div key={r.title} className="glass-card rounded-lg p-3 flex items-center justify-between">
            <div>
              <h3 className="font-display font-medium text-foreground text-sm">{r.title}</h3>
              <p className="text-xs text-muted-foreground">{r.genre} • {r.language}</p>
            </div>
            <span className={`text-[10px] font-medium px-2 py-1 rounded ${
              r.platform === "Theatrical" ? "bg-accent/20 text-accent" : "bg-primary/10 text-primary"
            }`}>
              {r.platform}
            </span>
          </div>
        ))}
      </div>
    )}
  </section>
);

export default TodayReleases;
