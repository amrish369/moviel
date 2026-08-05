import { ListVideo, Play } from "lucide-react";
import type { StudyPlaylist } from "@/hooks/useStudyFeed";

const StudyPlaylistCard = ({ playlist, onClick }: { playlist: StudyPlaylist; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="glass-card rounded-lg overflow-hidden text-left hover:border-primary/30 transition-all active:scale-[0.98] flex flex-col"
  >
    <div className="relative aspect-video bg-secondary">
      <img src={playlist.thumbnail} alt={playlist.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
      <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-background/85 text-foreground">
        <ListVideo className="w-3 h-3 text-primary" />
        {playlist.videoCount || "Playlist"}
      </span>
      <span className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-background/40">
        <Play className="w-8 h-8 text-primary fill-primary" />
      </span>
    </div>
    <div className="p-2.5">
      <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">{playlist.title}</h3>
      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{playlist.channel}</p>
    </div>
  </button>
);

export default StudyPlaylistCard;
