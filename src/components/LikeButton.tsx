import { Heart } from "lucide-react";
import type { Song } from "@/contexts/MusicPlayerContext";
import { useMusicTaste } from "@/lib/musicTaste";

const LikeButton = ({ song, className = "" , size = 4 }: { song: Song; className?: string; size?: number }) => {
  const { likedIds, toggle } = useMusicTaste();
  const on = likedIds.has(song.videoId);
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggle(song); }}
      aria-label={on ? "Unlike" : "Like"}
      aria-pressed={on}
      className={`flex items-center justify-center rounded-full transition-transform active:scale-125 ${className}`}
    >
      <Heart
        style={{ width: size * 4, height: size * 4 }}
        className={on ? "fill-cinema-red text-cinema-red animate-scale-in" : "text-foreground"}
      />
    </button>
  );
};

export default LikeButton;
