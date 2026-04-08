import { Gem, Quote, Star } from "lucide-react";
import SectionHeader from "./SectionHeader";

interface BonusSectionProps {
  hiddenGem: { title: string; description: string; imdb: number };
  quote: { quote: string; movie: string; character: string };
}

const BonusSection = ({ hiddenGem, quote }: BonusSectionProps) => (
  <section>
    <SectionHeader icon="💎" title="Bonus" />
    <div className="grid md:grid-cols-2 gap-4">
      <div className="glass-card rounded-lg p-4 border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <Gem className="w-4 h-4 text-primary" />
          <h3 className="font-display text-sm font-semibold text-foreground">Hidden Gem of the Day</h3>
        </div>
        <p className="text-sm font-medium text-foreground mb-1">{hiddenGem.title}</p>
        <p className="text-xs text-muted-foreground mb-2">{hiddenGem.description}</p>
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 text-primary fill-primary" />
          <span className="text-xs text-primary font-semibold">{hiddenGem.imdb} IMDb</span>
        </div>
      </div>
      <div className="glass-card rounded-lg p-4 border-accent/20">
        <div className="flex items-center gap-2 mb-2">
          <Quote className="w-4 h-4 text-accent" />
          <h3 className="font-display text-sm font-semibold text-foreground">Quote of the Day</h3>
        </div>
        <blockquote className="text-sm italic text-foreground mb-2">"{quote.quote}"</blockquote>
        <p className="text-xs text-muted-foreground">— {quote.character}, <span className="text-primary">{quote.movie}</span></p>
      </div>
    </div>
  </section>
);

export default BonusSection;
