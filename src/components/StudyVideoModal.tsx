import { X, SkipBack, SkipForward } from "lucide-react";
import type { StudyVideo } from "@/hooks/useStudyFeed";

interface Props {
  videos: StudyVideo[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

const StudyVideoModal = ({ videos, index, onClose, onIndexChange }: Props) => {
  const current = videos[index];
  if (!current) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <p className="text-sm font-medium text-foreground line-clamp-1 pr-3">{current.title}</p>
        <button aria-label="Close player" onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <X className="w-4 h-4 text-foreground" />
        </button>
      </div>

      <div className="aspect-video w-full bg-black">
        <iframe
          key={current.videoId}
          src={`https://www.youtube.com/embed/${current.videoId}?autoplay=1&rel=0&modestbranding=1`}
          title={current.title}
          className="w-full h-full"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="flex items-center justify-center gap-3 p-3 border-b border-border">
        <button
          disabled={index === 0}
          onClick={() => onIndexChange(index - 1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-xs text-foreground disabled:opacity-40"
        >
          <SkipBack className="w-3.5 h-3.5" /> Previous
        </button>
        <span className="text-xs text-muted-foreground">{index + 1} / {videos.length}</span>
        <button
          disabled={index >= videos.length - 1}
          onClick={() => onIndexChange(index + 1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-xs text-foreground disabled:opacity-40"
        >
          Next <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {videos.map((v, i) => (
          <button
            key={v.videoId}
            onClick={() => onIndexChange(i)}
            className={`w-full flex gap-3 text-left p-2 rounded-lg transition-colors ${
              i === index ? "bg-primary/15 border border-primary/30" : "hover:bg-secondary/60"
            }`}
          >
            <img src={v.thumbnail} alt={v.title} loading="lazy" decoding="async" className="w-24 aspect-video object-cover rounded-md shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground line-clamp-2">{v.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{v.channel} {v.duration && `• ${v.duration}`}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StudyVideoModal;
