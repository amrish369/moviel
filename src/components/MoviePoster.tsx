import { useState, useMemo } from "react";
import { Film } from "lucide-react";
import { useMoviePoster } from "@/hooks/useMoviePoster";

// Generate a consistent gradient based on movie title
const getGradient = (title: string): string => {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 40 + Math.abs((hash >> 8) % 60)) % 360;
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 25%), hsl(${hue2}, 60%, 15%))`;
};

const sizeClasses = {
  sm: "w-16 h-20 rounded-lg",
  md: "w-24 h-32 rounded-xl",
  lg: "w-full h-64 rounded-xl",
};

interface MoviePosterProps {
  title: string;
  year?: string | number;
  genre?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const MoviePoster = ({ title, year, genre, size = "sm", className = "" }: MoviePosterProps) => {
  const { posterUrl, isLoading } = useMoviePoster(title, year, genre);
  const [imgError, setImgError] = useState(false);
  const gradient = useMemo(() => getGradient(title), [title]);

  const showFallback = !posterUrl || imgError;

  const fallbackContent = (
    <div
      className={`${sizeClasses[size]} flex flex-col items-center justify-center gap-0.5 p-1 text-center shrink-0 ${className}`}
      style={{ background: gradient }}
    >
      <Film className={`text-white/40 ${size === "lg" ? "w-8 h-8" : "w-4 h-4"}`} />
      <span className={`text-white/70 font-medium leading-tight line-clamp-2 px-0.5 ${size === "lg" ? "text-sm" : "text-[7px]"}`}>
        {title}
      </span>
      {year && size !== "sm" && (
        <span className="text-white/40 text-[8px]">{year}</span>
      )}
    </div>
  );

  if (isLoading && !posterUrl) {
    return (
      <div className={`${sizeClasses[size]} relative overflow-hidden shrink-0 ${className}`} style={{ background: gradient }}>
        <div className="absolute inset-0 bg-white/5 animate-pulse" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 p-1">
          <Film className={`text-white/30 ${size === "lg" ? "w-8 h-8" : "w-4 h-4"}`} />
        </div>
      </div>
    );
  }

  if (showFallback) return fallbackContent;

  return (
    <img
      src={posterUrl}
      alt={`${title} poster`}
      className={`${sizeClasses[size]} object-cover shrink-0 ${className}`}
      loading="lazy"
      onError={() => setImgError(true)}
    />
  );
};

export default MoviePoster;
