import { useState } from "react";
import { Send, Copy, Check, ExternalLink, Bot, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const BOT_URL = "https://t.me/Cinedbot";

interface DownloadButtonProps {
  movieTitle?: string;
  variant?: "pill" | "full";
  className?: string;
  label?: string;
}

const DownloadButton = ({ movieTitle, variant = "pill", className = "", label }: DownloadButtonProps) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!movieTitle) return;
    try {
      await navigator.clipboard.writeText(movieTitle);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  const baseCls =
    variant === "full"
      ? "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[hsl(200,80%,50%)]/90 hover:bg-[hsl(200,80%,50%)] text-white font-display font-medium text-sm transition-colors"
      : "flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-[hsl(200,80%,50%)]/15 text-[hsl(200,80%,50%)] hover:bg-[hsl(200,80%,50%)]/25 transition-colors";

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className={`${baseCls} ${className}`}
        aria-label="Download via Telegram bot"
      >
        <Send className={variant === "full" ? "w-4 h-4" : "w-3 h-3"} />
        {variant === "full" ? (label || "Download via Bot") : (label || "Download")}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-gradient-gold">
              <Bot className="w-5 h-5 text-primary" />
              Get this movie on Telegram
            </DialogTitle>
            <DialogDescription>
              Movies are delivered through our Telegram bot <span className="font-semibold text-primary">@Cinedbot</span>.
              Follow the 3 steps below — takes 10 seconds.
            </DialogDescription>
          </DialogHeader>

          <ol className="space-y-3 mt-2 text-sm">
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">1</span>
              <div>
                <p className="text-foreground font-medium">Open the bot</p>
                <p className="text-xs text-muted-foreground">Tap below and press <span className="font-semibold">START</span> inside Telegram.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">2</span>
              <div>
                <p className="text-foreground font-medium">Paste the movie name</p>
                <p className="text-xs text-muted-foreground">Copy the title below and send it as a message to the bot.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">3</span>
              <div>
                <p className="text-foreground font-medium">Pick quality &amp; download</p>
                <p className="text-xs text-muted-foreground">The bot replies with 480p / 720p / 1080p download links.</p>
              </div>
            </li>
          </ol>

          {movieTitle && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-2">
              <MessageCircle className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-medium text-foreground truncate flex-1">{movieTitle}</span>
              <button
                onClick={copy}
                className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-primary/15 hover:bg-primary/25 text-primary transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          )}

          <a
            href={BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-[hsl(200,80%,50%)] hover:bg-[hsl(200,80%,55%)] text-white font-display font-semibold text-sm transition-colors"
          >
            <Send className="w-4 h-4" />
            Open @Cinedbot on Telegram
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>

          <p className="text-[11px] text-muted-foreground text-center mt-1">
            Telegram app required. Free • No signup on CineRadar needed.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DownloadButton;