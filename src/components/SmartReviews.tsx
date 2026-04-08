import { ThumbsUp, ThumbsDown, BarChart3, Target } from "lucide-react";
import SectionHeader from "./SectionHeader";
import type { Review } from "@/data/movieData";

const sentimentColors = {
  Good: "text-cinema-green",
  Average: "text-primary",
  Poor: "text-cinema-red",
};

const verdictColors = {
  Watch: "bg-cinema-green/15 text-cinema-green",
  Skip: "bg-cinema-red/15 text-cinema-red",
  "OTT Wait": "bg-primary/15 text-primary",
};

const SmartReviews = ({ reviews }: { reviews: Review[] }) => (
  <section>
    <SectionHeader icon="⭐" title="Smart Review Summary" />
    <div className="grid gap-4">
      {reviews.map((r) => (
        <div key={r.title} className="glass-card rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-foreground">{r.title}</h3>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${verdictColors[r.verdict]}`}>
              {r.verdict === "Watch" ? "🎯" : r.verdict === "Skip" ? "❌" : "⏳"} {r.verdict}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground flex items-center gap-1 mb-1">
                <ThumbsUp className="w-3 h-3" /> Positives
              </p>
              <ul className="space-y-0.5">
                {r.positives.map((p) => (
                  <li key={p} className="text-cinema-green">✓ {p}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-muted-foreground flex items-center gap-1 mb-1">
                <ThumbsDown className="w-3 h-3" /> Negatives
              </p>
              <ul className="space-y-0.5">
                {r.negatives.map((n) => (
                  <li key={n} className="text-cinema-red">✗ {n}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <BarChart3 className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">Sentiment:</span>
            <span className={`font-semibold ${sentimentColors[r.sentiment]}`}>{r.sentiment}</span>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default SmartReviews;
