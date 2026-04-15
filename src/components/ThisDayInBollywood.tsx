import { Calendar, Sparkles } from "lucide-react";
import SectionHeader from "./SectionHeader";
import type { ThisDayFact } from "@/data/movieData";

const ThisDayInBollywood = ({ fact }: { fact: ThisDayFact }) => {
  const today = new Date().toLocaleDateString("en-IN", { month: "long", day: "numeric" });

  return (
    <section>
      <SectionHeader icon="🗓️" title="This Day in Bollywood" subtitle={today} />
      <div className="glass-card rounded-lg p-5 border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary">{fact.year}</span>
          </div>
          <p className="font-display text-base font-semibold text-foreground leading-snug">
            {fact.event}
          </p>
          <div className="flex items-start gap-2 bg-secondary/50 rounded-md p-3">
            <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-foreground/70 font-medium">Did you know?</span> {fact.trivia}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ThisDayInBollywood;
