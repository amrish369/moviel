import { Flame, Globe, MapPin } from "lucide-react";
import SectionHeader from "./SectionHeader";
import type { TrendingItem } from "@/data/movieData";

const TrendingList = ({ items, icon, label }: { items: TrendingItem[]; icon: React.ReactNode; label: string }) => (
  <div className="glass-card rounded-lg p-4">
    <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
      {icon} {label}
    </h3>
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.title} className="flex items-center gap-3">
          <span className="text-xs font-bold text-primary w-5 text-right">{item.rank}</span>
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-foreground">{item.title}</span>
          <Flame className="w-3 h-3 text-accent shrink-0" />
        </div>
      ))}
    </div>
  </div>
);

const TrendingSection = ({ worldwide, india }: { worldwide: TrendingItem[]; india: TrendingItem[] }) => (
  <section>
    <SectionHeader icon="🔥" title="Trending Now" />
    <div className="grid md:grid-cols-2 gap-4">
      <TrendingList items={worldwide} icon={<Globe className="w-4 h-4 text-primary" />} label="Worldwide" />
      <TrendingList items={india} icon={<MapPin className="w-4 h-4 text-accent" />} label="India" />
    </div>
  </section>
);

export default TrendingSection;
