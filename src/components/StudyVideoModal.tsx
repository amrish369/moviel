import { useEffect, useRef, useState } from "react";
import { X, SkipBack, SkipForward, Bookmark, BookmarkCheck, CheckCircle2, Circle, RotateCcw } from "lucide-react";
import type { StudyVideo } from "@/hooks/useStudyFeed";
import { useStudyLibrary } from "@/hooks/useStudyLibrary";

interface Props {
  videos: StudyVideo[];
  index: number;
  subjectId: string;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

const StudyVideoModal = ({ videos, index, subjectId, onClose, onIndexChange }: Props) => {
  const current = videos[index];
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const timeRef = useRef({ seconds: 0, duration: 0 });
  const { progress, bookmarks, saveProgress, setCompleted, resumeAt, toggleBookmark } = useStudyLibrary();
  const [startAt, setStartAt] = useState(0);

  // Compute resume point when the video changes
  useEffect(() => {
    if (!current) return;
    setStartAt(resumeAt(current.videoId));
    timeRef.current = { seconds: 0, duration: 0 };
  }, [current?.videoId, resumeAt]);

  // Poll YouTube player for currentTime / duration and persist progress
  useEffect(() => {
    if (!current) return;
    const post = (msg: unknown) => iframeRef.current?.contentWindow?.postMessage(JSON.stringify(msg), "*");
    const onMessage = (e: MessageEvent) => {
      if (typeof e.data !== "string" || !e.data.includes("infoDelivery")) return;
      try {
        const info = JSON.parse(e.data)?.info;
        if (typeof info?.currentTime === "number") timeRef.current.seconds = info.currentTime;
        if (typeof info?.duration === "number" && info.duration > 0) timeRef.current.duration = info.duration;
      } catch {}
    };
    window.addEventListener("message", onMessage);
    const handshake = setInterval(() => post({ event: "listening", id: 1 }), 1000);
    const persist = setInterval(() => {
      const { seconds, duration } = timeRef.current;
      if (seconds > 3) {
        saveProgress({
          videoId: current.videoId,
          subjectId,
          title: current.title,
          channel: current.channel,
          thumbnail: current.thumbnail,
          seconds,
          duration,
        });
      }
    }, 5000);
    return () => {
      window.removeEventListener("message", onMessage);
      clearInterval(handshake);
      clearInterval(persist);
      const { seconds, duration } = timeRef.current;
      if (seconds > 3) {
        saveProgress({
          videoId: current.videoId,
          subjectId,
          title: current.title,
          channel: current.channel,
          thumbnail: current.thumbnail,
          seconds,
          duration,
        });
      }
    };
  }, [current?.videoId, subjectId, saveProgress]);

  if (!current) return null;

  const entry = progress[current.videoId];
  const isBookmarked = Boolean(bookmarks[current.videoId]);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border gap-2">
        <p className="text-sm font-medium text-foreground line-clamp-1 pr-1">{current.title}</p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            aria-label={isBookmarked ? "Remove bookmark" : "Save video"}
            onClick={() =>
              toggleBookmark({
                videoId: current.videoId,
                subjectId,
                title: current.title,
                channel: current.channel,
                thumbnail: current.thumbnail,
                duration: current.duration,
              })
            }
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${isBookmarked ? "bg-primary/20" : "bg-secondary"}`}
          >
            {isBookmarked ? <BookmarkCheck className="w-4 h-4 text-primary" /> : <Bookmark className="w-4 h-4 text-foreground" />}
          </button>
          <button aria-label="Close player" onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>
      </div>

      <div className="aspect-video w-full bg-black">
        <iframe
          key={`${current.videoId}-${startAt}`}
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${current.videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&playsinline=1${startAt ? `&start=${startAt}` : ""}`}
          title={current.title}
          className="w-full h-full"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 p-3 border-b border-border">
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
        <button
          onClick={() => setCompleted(current.videoId, !entry?.completed)}
          disabled={!entry}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs disabled:opacity-40 ${
            entry?.completed ? "bg-primary/20 text-primary" : "bg-secondary text-foreground"
          }`}
        >
          {entry?.completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
          {entry?.completed ? "Completed" : "Mark complete"}
        </button>
        <button
          onClick={() => setShowQuiz((s) => !s)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs ${
            showQuiz ? "bg-primary/20 text-primary" : "bg-secondary text-foreground"
          }`}
        >
          <Brain className="w-3.5 h-3.5" /> Quiz
          {quizzes[current.videoId] && ` ${quizzes[current.videoId].score}/${quizzes[current.videoId].total}`}
        </button>
        {startAt > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-primary">
            <RotateCcw className="w-3 h-3" /> Resumed at {fmt(startAt)}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {showQuiz && (
          <StudyQuiz
            key={current.videoId}
            videoId={current.videoId}
            title={current.title}
            subjectId={subjectId}
            onClose={() => setShowQuiz(false)}
          />
        )}
        {videos.map((v, i) => {
          const p = progress[v.videoId];
          const pct = p?.duration ? Math.min(100, (p.seconds / p.duration) * 100) : p?.completed ? 100 : 0;
          return (
            <button
              key={v.videoId}
              onClick={() => onIndexChange(i)}
              className={`w-full flex gap-3 text-left p-2 rounded-lg transition-colors ${
                i === index ? "bg-primary/15 border border-primary/30" : "hover:bg-secondary/60"
              }`}
            >
              <div className="relative w-24 shrink-0">
                <img src={v.thumbnail} alt={v.title} loading="lazy" decoding="async" className="w-24 aspect-video object-cover rounded-md" />
                {pct > 0 && (
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-background/70 rounded-b-md overflow-hidden">
                    <span className="block h-full bg-primary" style={{ width: `${pct}%` }} />
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground line-clamp-2">
                  {p?.completed && <CheckCircle2 className="inline w-3 h-3 text-primary mr-1 -mt-0.5" />}
                  {v.title}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{v.channel} {v.duration && `• ${v.duration}`}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StudyVideoModal;
