import { Star, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MoviePoster from "./MoviePoster";
import SectionHeader from "./SectionHeader";
import type { Movie } from "@/data/movieData";

const DailySuggestions = ({ movies }: { movies: Movie[] }) => {
  const navigate = useNavigate();

  return (
    <section>
      <SectionHeader icon="🎬" title="Daily Movie Suggestions" subtitle="Top picks for today based on ratings & trends" />
      <div className="grid gap-3">
        {movies.map((movie, i) => (
          <div
            key={movie.title}
            onClick={() => navigate(`/movie?title=${encodeURIComponent(movie.title)}`)}
            className="glass-card rounded-lg p-4 hover:border-primary/30 transition-all group cursor-pointer active:scale-[0.98]"
          >
            <div className="flex items-start gap-3">
              <MoviePoster title={movie.title} year={movie.year} genre={movie.genre} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">#{i + 1}</span>
                      <h3 className="font-display font-semibold text-foreground truncate group-hover:text-primary transition-colors">{movie.title}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span>{movie.year}</span>
                      <span>•</span>
                      <span>{movie.genre}</span>
                      <span>•</span>
                      <span>{movie.language}</span>
                    </div>
                    <p className="text-xs text-cinema-highlight">🎯 {movie.whyWatch}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded">
                  <Star className="w-3 h-3 text-primary fill-primary" />
                  <span className="text-sm font-bold text-primary">{movie.imdb}</span>
                </div>
                <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                  {movie.platform}
                </span>
                <a
                  href="https://t.me/cineradarai"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-[hsl(200,80%,50%)]/15 text-[hsl(200,80%,50%)] hover:bg-[hsl(200,80%,50%)]/25 transition-colors"
                >
                  <Send className="w-3 h-3" />
                  Download
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DailySuggestions;
