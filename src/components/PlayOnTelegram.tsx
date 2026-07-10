import { Play } from "lucide-react";

const BOT_USERNAME = "Cinedbot";

const toSlug = (title: string, year?: number | null) => {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return year ? `${base}-${year}` : base;
};

/**
 * Deep-links to the Telegram bot which has every movie in its DB.
 * Format: https://t.me/<bot>?start=<title-year-slug>
 * The bot receives /start <slug> and sends the full movie back inside Telegram.
 * (Telegram file streams cannot be embedded in a browser, so playback stays in Telegram.)
 */
const PlayOnTelegram = ({ title, year }: { title: string; year?: number | null }) => {
  const href = `https://t.me/${BOT_USERNAME}?start=${toSlug(title, year)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      aria-label={`Play ${title} on Telegram`}
      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary hover:bg-primary/25 transition-colors font-medium"
    >
      <Play className="w-3 h-3 fill-primary" />
      Play
    </a>
  );
};

export default PlayOnTelegram;