import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Star, User, Calendar, MapPin, Film } from "lucide-react";
import { useActorFilms, ActorFilm } from "@/hooks/useActorFilms";

const TABS = ["Top Rated", "Upcoming", "Released"] as const;
type Tab = typeof TABS[number];

const FilmCard = ({ film, onClick }: { film: ActorFilm; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="glass-card rounded-lg p-3 text-left hover:border-primary/30 transition-all w-full flex gap-3"
  >
    {film.poster ? (
      <img src={film.poster} alt={film.title} className="w-14 h-20 rounded object-cover shrink-0 bg-secondary" loading="lazy" />
    ) : (
      <div className="w-14 h-20 rounded bg-secondary flex items-center justify-center shrink-0">
        <Film className="w-5 h-5 text-muted-foreground" />
      </div>
    )}
    <div className="flex-1 min-w-0 space-y-1">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-sm font-semibold text-foreground line-clamp-2">{film.title}</h3>
        {film.rating > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-3 h-3 text-primary fill-primary" />
            <span className="text-xs font-bold text-primary">{film.rating}</span>
          </div>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {film.year || "TBA"} {film.character ? `• as ${film.character}` : ""}
      </p>
      {film.releaseDate && (
        <p className="text-[10px] text-muted-foreground/80">{film.releaseDate}</p>
      )}
    </div>
  </button>
);

const ActorDetailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const name = searchParams.get("name") || "";
  const { data, isLoading, error, fetchActor } = useActorFilms();
  const [tab, setTab] = useState<Tab>("Top Rated");

  useEffect(() => {
    if (name) fetchActor(name);
  }, [name, fetchActor]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-card rounded-xl p-8 flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-foreground font-display font-medium">Loading "{name}"...</p>
          <p className="text-xs text-muted-foreground">Fetching filmography</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card rounded-xl p-8 text-center max-w-md">
          <p className="text-cinema-red font-medium mb-2">⚠️ {error || "Actor not found"}</p>
          <button onClick={() => navigate("/")} className="text-primary text-sm hover:underline">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { actor, released, upcoming, topRated } = data;
  const currentList = tab === "Top Rated" ? topRated : tab === "Upcoming" ? upcoming : released;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-base font-bold text-foreground truncate">{actor.name}</h1>
            <p className="text-[10px] text-muted-foreground">{actor.knownForDepartment} • {actor.totalMovies} films</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Profile */}
        <section className="glass-card rounded-xl p-5 flex gap-4">
          {actor.profile ? (
            <img src={actor.profile} alt={actor.name} className="w-24 h-32 rounded-lg object-cover bg-secondary shrink-0" />
          ) : (
            <div className="w-24 h-32 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-2">
            <h2 className="font-display text-lg font-bold text-foreground">{actor.name}</h2>
            {actor.birthday && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {actor.birthday}
              </p>
            )}
            {actor.placeOfBirth && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {actor.placeOfBirth}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cinema-green/15 text-cinema-green">
                {actor.releasedCount} Released
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                {actor.upcomingCount} Upcoming
              </span>
            </div>
          </div>
        </section>

        {actor.biography && (
          <section className="glass-card rounded-xl p-5">
            <h3 className="font-display font-bold text-foreground mb-2 text-sm">About</h3>
            <p className="text-sm text-foreground/85 leading-relaxed line-clamp-6">{actor.biography}</p>
          </section>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map((t) => {
            const count = t === "Top Rated" ? topRated.length : t === "Upcoming" ? upcoming.length : released.length;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {t} ({count})
              </button>
            );
          })}
        </div>

        {/* List */}
        <section className="space-y-2">
          {currentList.length === 0 ? (
            <div className="glass-card rounded-lg p-6 text-center text-sm text-muted-foreground">
              No movies in this list.
            </div>
          ) : (
            currentList.map((film) => (
              <FilmCard
                key={film.id}
                film={film}
                onClick={() => navigate(`/movie?title=${encodeURIComponent(film.title)}`)}
              />
            ))
          )}
        </section>

        <footer className="text-center py-6 border-t border-border">
          <p className="text-xs text-muted-foreground">CineRadar • Actor Filmography</p>
        </footer>
      </main>
    </div>
  );
};

export default ActorDetailPage;