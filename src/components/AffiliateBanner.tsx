import { AFFILIATE_OFFERS } from "@/config/ads";
import { ExternalLink } from "lucide-react";

/** Rotating affiliate offer card — monetises even before AdSense approval. */
const AffiliateBanner = ({ index = 0, className = "" }: { index?: number; className?: string }) => {
  const offer = AFFILIATE_OFFERS[index % AFFILIATE_OFFERS.length];
  if (!offer) return null;

  return (
    <a
      href={offer.url}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className={`glass-card rounded-xl p-4 flex items-center gap-3 border border-primary/20 hover:border-primary/50 transition-colors ${className}`}
    >
      <span className="text-2xl shrink-0">{offer.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-sm font-bold text-foreground truncate">{offer.title}</h3>
          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
            Ad
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{offer.subtitle}</p>
      </div>
      <span className="shrink-0 flex items-center gap-1 text-xs font-semibold text-primary">
        {offer.cta}
        <ExternalLink className="w-3 h-3" />
      </span>
    </a>
  );
};

export default AffiliateBanner;
