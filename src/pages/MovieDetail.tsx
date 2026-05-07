import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Star, Clock, Globe, Film, Users, Clapperboard,
  DollarSign, Play, Loader2, User, Pen, Music, Camera, Award, Send
} from "lucide-react";
import { useMovieDetail } from "@/hooks/useMovieDetail";
import MoviePoster from "@/components/MoviePoster";

const MovieDetailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const title = searchParams.get("title") || "";
  const { movie, isLoading, error, fetchDetail } = useMovieDetail();

  useEffect(() => {
    if (title) fetchDetail(title);
  }, [title, fetchDetail]);

  // SEO: dynamic title, description, canonical, and Movie JSON-LD
  useEffect(() => {
    if (!movie) return;
    const seoTitle = `${movie.title} (${movie.year}) — Cast, Plot, Reviews & Trailer | CineRadar`;
    const seoDesc = (movie.plot || `${movie.title} ${movie.year} ${movie.genre} movie — cast, ratings, box office, trailer and where to watch.`).slice(0, 158);
    document.title = seoTitle;

    const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", seoDesc);
    setMeta("keywords", `${movie.title}, ${movie.title} review, ${movie.title} cast, ${movie.title} trailer, ${movie.year} ${movie.genre.toLowerCase()} movie, bollywood, south indian, ott`);
    setMeta("og:title", seoTitle, "property");
    setMeta("og:description", seoDesc, "property");
    setMeta("og:type", "video.movie", "property");
    if ((movie as any).poster) setMeta("og:image", (movie as any).poster, "property");

    const canonicalHref = `https://moviel.lovable.app/movie?title=${encodeURIComponent(movie.title)}`;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = canonicalHref;

    const ldId = "movie-jsonld";
    document.getElementById(ldId)?.remove();
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.id = ldId;
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Movie",
      name: movie.title,
      description: movie.plot || undefined,
      image: (movie as any).poster || undefined,
      datePublished: movie.year ? String(movie.year) : undefined,
      genre: movie.genre ? movie.genre.split(",").map(g => g.trim()) : undefined,
      inLanguage: movie.language || undefined,
      duration: movie.runtime || undefined,
      director: movie.director ? { "@type": "Person", name: movie.director.name } : undefined,
      actor: (movie.cast || []).slice(0, 8).map(a => ({ "@type": "Person", name: a.name })),
      aggregateRating: movie.imdb ? {
        "@type": "AggregateRating", ratingValue: movie.imdb, bestRating: 10, ratingCount: 1000
      } : undefined,
    });
    document.head.appendChild(ld);

    return () => { document.getElementById(ldId)?.remove(); };
  }, [movie]);

  const handleSimilarClick = (similarTitle: string) => {
    navigate(`/movie?title=${encodeURIComponent(similarTitle)}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-card rounded-xl p-8 flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-foreground font-display font-medium">Loading Movie Details...</p>
          <p className="text-xs text-muted-foreground">Fetching info for "{title}"</p>
        </div>
      </div>
    );
  }

  if (!movie && (error || !isLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card rounded-xl p-8 text-center max-w-md">
          <p className="text-cinema-red font-medium mb-2">⚠️ {error || "Movie not found"}</p>
          <button onClick={() => navigate("/")} className="text-primary text-sm hover:underline">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!movie) return null;

  const trailerUrl = movie.trailerQuery
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.trailerQuery)}`
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-base font-bold text-foreground truncate">{movie.title}</h1>
            <p className="text-[10px] text-muted-foreground">{movie.year} • {movie.genre}</p>
          </div>
          <div className="flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-lg shrink-0">
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm font-bold text-primary">{movie.imdb}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-sm text-primary">
            ⚠️ {error}
          </div>
        )}

        {/* Hero Info */}
        <section className="glass-card rounded-xl p-5 space-y-4">
          <MoviePoster title={movie.title} year={movie.year} genre={movie.genre} size="lg" className="mx-auto" />
          {movie.tagline && (
            <p className="text-sm italic text-primary/80 text-center">"{movie.tagline}"</p>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {movie.runtime && (
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{movie.runtime}</span>
            )}
            {movie.language && (
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{movie.language}</span>
            )}
            {movie.certification && (
              <span className="flex items-center gap-1"><Film className="w-3 h-3" />{movie.certification}</span>
            )}
            {movie.platform && (
              <span className="flex items-center gap-1 text-primary font-medium">
                <Play className="w-3 h-3" />{movie.platform}
              </span>
            )}
          </div>
          {movie.plot && (
            <p className="text-sm text-foreground/90 leading-relaxed">{movie.plot}</p>
          )}
        </section>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {trailerUrl && (
            <a
              href={trailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-cinema-red/90 hover:bg-cinema-red text-white font-display font-medium text-sm transition-colors"
            >
              <Play className="w-4 h-4 fill-white" />
              Watch Trailer
            </a>
          )}
          <a
            href="https://t.me/cineradarai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[hsl(200,80%,50%)]/90 hover:bg-[hsl(200,80%,50%)] text-white font-display font-medium text-sm transition-colors"
          >
            <Send className="w-4 h-4" />
            Download from Telegram
          </a>
        </div>

        {/* Director & Writers */}
        <section className="glass-card rounded-xl p-5 space-y-4">
          <h2 className="font-display font-bold text-foreground flex items-center gap-2">
            <Clapperboard className="w-4 h-4 text-primary" /> Crew
          </h2>
          {movie.director && (
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Director</p>
              <p className="text-sm text-foreground font-medium">{movie.director.name}</p>
              {movie.director.knownFor && movie.director.knownFor.length > 0 && (
                <p className="text-xs text-muted-foreground">Known for: {movie.director.knownFor.join(", ")}</p>
              )}
            </div>
          )}
          {movie.writers && movie.writers.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                <Pen className="w-3 h-3" /> Writers & Story
              </p>
              <div className="space-y-1">
                {movie.writers.map((w, i) => (
                  <p key={i} className="text-sm text-foreground">
                    {w.name} {w.role && <span className="text-xs text-muted-foreground">({w.role})</span>}
                  </p>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {movie.music && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                  <Music className="w-3 h-3" /> Music
                </p>
                <p className="text-sm text-foreground">{movie.music}</p>
              </div>
            )}
            {movie.cinematography && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                  <Camera className="w-3 h-3" /> Cinematography
                </p>
                <p className="text-sm text-foreground">{movie.cinematography}</p>
              </div>
            )}
          </div>
          {movie.producers && movie.producers.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Producers</p>
              <p className="text-sm text-foreground">{movie.producers.join(", ")}</p>
            </div>
          )}
        </section>

        {/* Cast */}
        {movie.cast && movie.cast.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-display font-bold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Cast
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {movie.cast.map((actor, i) => (
                <button
                  key={i}
                  onClick={() => navigate(`/actor?name=${encodeURIComponent(actor.name)}`)}
                  className="glass-card rounded-lg p-3 text-center space-y-2 hover:border-primary/30 transition-all w-full active:scale-[0.98]"
                >
                  <div className="w-14 h-14 mx-auto rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground truncate hover:text-primary">{actor.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">as {actor.character}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Box Office */}
        {movie.boxOffice && (
          <section className="glass-card rounded-xl p-5 space-y-3">
            <h2 className="font-display font-bold text-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> Box Office
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {movie.boxOffice.budget && (
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Budget</p>
                  <p className="text-sm font-bold text-foreground">{movie.boxOffice.budget}</p>
                </div>
              )}
              {movie.boxOffice.openingDay && (
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Opening Day</p>
                  <p className="text-sm font-bold text-foreground">{movie.boxOffice.openingDay}</p>
                </div>
              )}
              {movie.boxOffice.totalIndia && (
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">India Total</p>
                  <p className="text-sm font-bold text-foreground">{movie.boxOffice.totalIndia}</p>
                </div>
              )}
              {movie.boxOffice.totalWorldwide && (
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Worldwide</p>
                  <p className="text-sm font-bold text-foreground">{movie.boxOffice.totalWorldwide}</p>
                </div>
              )}
            </div>
            {movie.boxOffice.verdict && (
              <div className="text-center">
                <span className={`inline-block text-xs font-bold px-4 py-1.5 rounded-full ${
                  movie.boxOffice.verdict === "Blockbuster" ? "bg-cinema-green/20 text-cinema-green" :
                  movie.boxOffice.verdict === "Hit" ? "bg-primary/20 text-primary" :
                  movie.boxOffice.verdict === "Flop" ? "bg-cinema-red/20 text-cinema-red" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {movie.boxOffice.verdict}
                </span>
              </div>
            )}
          </section>
        )}

        {/* Ratings */}
        {movie.ratings && (
          <section className="glass-card rounded-xl p-5 space-y-3">
            <h2 className="font-display font-bold text-foreground flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" /> Ratings
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {movie.ratings.imdb && (
                <div className="text-center bg-secondary/50 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground">IMDb</p>
                  <p className="text-lg font-bold text-primary">{movie.ratings.imdb}</p>
                </div>
              )}
              {movie.ratings.rottenTomatoes && (
                <div className="text-center bg-secondary/50 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground">Rotten 🍅</p>
                  <p className="text-lg font-bold text-foreground">{movie.ratings.rottenTomatoes}</p>
                </div>
              )}
              {movie.ratings.audienceScore && (
                <div className="text-center bg-secondary/50 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground">Audience</p>
                  <p className="text-lg font-bold text-foreground">{movie.ratings.audienceScore}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Similar Movies */}
        {movie.similarMovies && movie.similarMovies.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-display font-bold text-foreground">🎯 You May Also Like</h2>
            <div className="grid gap-3">
              {movie.similarMovies.map((sim, i) => (
                <button
                  key={i}
                  onClick={() => handleSimilarClick(sim.title)}
                  className="glass-card rounded-lg p-4 text-left hover:border-primary/30 transition-all w-full"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-sm font-semibold text-foreground">{sim.title}</h3>
                      <p className="text-xs text-muted-foreground">{sim.year} • {sim.genre}</p>
                      {sim.whyWatch && (
                        <p className="text-xs text-cinema-highlight mt-1">💡 {sim.whyWatch}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="w-3 h-3 text-primary fill-primary" />
                      <span className="text-xs font-bold text-primary">{sim.imdb}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        <footer className="text-center py-6 border-t border-border">
          <p className="text-xs text-muted-foreground">CineRadar • AI Movie Intelligence</p>
        </footer>
      </main>
    </div>
  );
};

export default MovieDetailPage;
