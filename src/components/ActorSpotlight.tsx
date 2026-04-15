import { useNavigate } from "react-router-dom";
import { User, Film, ChevronRight } from "lucide-react";
import SectionHeader from "./SectionHeader";
import type { ActorSpotlight as ActorSpotlightType } from "@/data/movieData";

const ActorSpotlightSection = ({ actors }: { actors: ActorSpotlightType[] }) => {
  const navigate = useNavigate();

  return (
    <section>
      <SectionHeader icon="🌟" title="Actor Spotlight" subtitle="Stars to watch in 2026" />
      <div className="grid gap-3">
        {actors.map((actor) => (
          <div
            key={actor.name}
            className="glass-card rounded-lg p-4 hover:border-primary/30 transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                {actor.image}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold text-foreground">{actor.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {actor.upcomingCount} Upcoming
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <Film className="w-3 h-3 inline mr-1" />
                  Known for: {actor.knownFor}
                </p>
                <p className="text-xs text-primary/80 mt-1 italic">💡 {actor.fact}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ActorSpotlightSection;
