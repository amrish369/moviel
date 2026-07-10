import { Play } from "lucide-react";

const BOT_USERNAME = "Cinedbot";

/**
 * Deep-links to the Telegram bot which has every movie in its DB.
 * Format: https://t.me/<bot>?start=<tmdb_id>
 * The bot receives /start <tmdb_id> and streams the full movie back.
 */
const PlayOnTelegram = ({ tmdbId, title }: { tmdbId: number; title?: string }) => {
  const href = `https://t.me/${BOT_USERNAME}?start=${tmdbId}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      aria-label={title ? `Play ${title} on Telegram` : "Play on Telegram"}
      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary hover:bg-primary/25 transition-colors font-medium"
    >
      <Play className="w-3 h-3 fill-primary" />
      Play
    </a>
  );
};

export default PlayOnTelegram;