import { Film } from "lucide-react";
import { useMoviePoster } from "@/hooks/useMoviePoster";

interface MoviePosterProps {
  title: string;
  year?: string | number;
  genre?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-16 h-20 rounded-lg",
  md: "w-24 h-32 rounded-xl",
  lg: "w-full h-64 rounded-xl",
};

const MoviePoster = ({ title, year, genre, size = "sm", className = "" }: MoviePosterProps) => {
  const { posterUrl, isLoading } = useMoviePoster(title, year, genre);

  if (isLoading) {
    return (
      <div className={`${sizeClasses[size]} bg-secondary animate-pulse flex items-center justify-center shrink-0 ${className}`}>
        <Film className="w-5 h-5 text-muted-foreground/40" />
      </div>
    );
  }

  if (!posterUrl) {
    return (
      <div className={`${sizeClasses[size]} bg-secondary flex items-center justify-center shrink-0 ${className}`}>
        <Film className="w-5 h-5 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <img
      src={posterUrl}
      alt={`${title} poster`}
      className={`${sizeClasses[size]} object-cover shrink-0 ${className}`}
      loading="lazy"
    />
  );
};

export default MoviePoster;
