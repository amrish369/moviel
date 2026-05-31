import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TMDB_BASE = "https://api.themoviedb.org/3";

const INDIAN_LANGS =
  "hi|ta|te|ml|kn|bn|mr|pa|gu|or|as";

const LANGUAGE_NAMES: Record<string, string> = {
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu",
  ml: "Malayalam",
  kn: "Kannada",
  bn: "Bengali",
  mr: "Marathi",
  pa: "Punjabi",
  gu: "Gujarati",
  or: "Odia",
  as: "Assamese",
  en: "English",
};

function langName(code: string) {
  return LANGUAGE_NAMES[code] || code.toUpperCase();
}

function tmdbAuth() {
  const key = Deno.env.get("TMDB_API_KEY") || "";

  if (key.startsWith("eyJ") || key.length > 60) {
    return {
      headers: {
        Authorization: `Bearer ${key}`,
      },
      keyParam: "",
    };
  }

  return {
    headers: {},
    keyParam: key,
  };
}

async function tmdbFetch(
  path: string,
  query: Record<string, string> = {},
) {
  const auth = tmdbAuth();

  const params = new URLSearchParams(query);

  if (auth.keyParam) {
    params.set("api_key", auth.keyParam);
  }

  const response = await fetch(
    `${TMDB_BASE}${path}?${params.toString()}`,
    {
      headers: auth.headers,
    },
  );

  if (!response.ok) {
    throw new Error(`TMDB Error ${response.status}`);
  }

  return response.json();
}

async function getMovieDetails(movieId: number) {
  try {
    const [details, videos, credits, providers, similar] =
      await Promise.all([
        tmdbFetch(`/movie/${movieId}`),
        tmdbFetch(`/movie/${movieId}/videos`),
        tmdbFetch(`/movie/${movieId}/credits`),
        tmdbFetch(`/movie/${movieId}/watch/providers`),
        tmdbFetch(`/movie/${movieId}/similar`, {
          page: "1",
        }),
      ]);

    const trailers =
      (videos.results || [])
        .filter((v: any) => v.site === "YouTube")
        .slice(0, 5)
        .map((v: any) => ({
          key: v.key,
          name: v.name,
          type: v.type,
          official: v.official,
        }));

    const cast =
      (credits.cast || [])
        .slice(0, 10)
        .map((c: any) => ({
          id: c.id,
          name: c.name,
          character: c.character,
          profile:
            c.profile_path
              ? `https://image.tmdb.org/t/p/w185${c.profile_path}`
              : null,
        }));

    const watchProviders =
      providers.results?.IN?.flatrate?.map(
        (p: any) => p.provider_name,
      ) || [];

    const similarMovies =
      (similar.results || [])
        .slice(0, 10)
        .map((m: any) => ({
          id: m.id,
          title: m.title,
          poster: m.poster_path
            ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
            : null,
        }));

    return {
      id: details.id,
      title: details.title,
      originalTitle: details.original_title,
      overview: details.overview,
      year: details.release_date
        ? Number(details.release_date.slice(0, 4))
        : null,
      releaseDate: details.release_date,
      runtime: details.runtime,
      status: details.status,
      popularity: details.popularity,
      rating: Number(details.vote_average?.toFixed(1)),
      votes: details.vote_count,
      language: langName(details.original_language),
      genres:
        details.genres?.map((g: any) => g.name) || [],
      adult: details.adult,
      homepage: details.homepage,
      imdbId: details.imdb_id,

      poster:
        details.poster_path
          ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
          : null,

      backdrop:
        details.backdrop_path
          ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
          : null,

      trailers,
      cast,
      watchProviders,
      similarMovies,
    };
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    if (!Deno.env.get("TMDB_API_KEY")) {
      throw new Error("TMDB_API_KEY not configured");
    }

    const body = await req.json().catch(() => ({}));

    const page = Math.max(
      1,
      Math.min(20, Number(body.page) || 1),
    );

    const mode = body.mode || "discover";

    /*
      Modes:
      discover
      trending
      upcoming
      search
      details
    */

    if (mode === "details") {
      const movieId = Number(body.movieId);

      if (!movieId) {
        throw new Error("movieId required");
      }

      const movie = await getMovieDetails(movieId);

      return new Response(
        JSON.stringify(movie),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    let response;

    if (mode === "trending") {
      response = await tmdbFetch(
        "/trending/movie/week",
        {
          page: String(page),
        },
      );
    } else if (mode === "upcoming") {
      response = await tmdbFetch(
        "/movie/upcoming",
        {
          region: "IN",
          page: String(page),
        },
      );
    } else if (mode === "search") {
      response = await tmdbFetch(
        "/search/movie",
        {
          query: body.query || "",
          page: String(page),
          include_adult: "false",
        },
      );
    } else {
      const discoverParams: Record<
        string,
        string
      > = {
        with_original_language:
          body.language || INDIAN_LANGS,
        sort_by:
          body.sortBy ||
          "popularity.desc",
        include_adult: "false",
        page: String(page),
        region: "IN",
        "vote_count.gte": "10",
      };

      if (body.genre) {
        discoverParams.with_genres =
          String(body.genre);
      }

      if (body.year) {
        discoverParams.primary_release_year =
          String(body.year);
      }

      if (body.provider) {
        discoverParams.watch_region = "IN";
        discoverParams.with_watch_providers =
          String(body.provider);
      }

      response = await tmdbFetch(
        "/discover/movie",
        discoverParams,
      );
    }

    const excludeIds: number[] =
      Array.isArray(body.excludeIds)
        ? body.excludeIds
        : [];

    const excluded = new Set(excludeIds);

    const movies = (response.results || [])
      .filter(
        (movie: any) =>
          !excluded.has(movie.id),
      )
      .slice(0, 20);

    const enrichedMovies =
      await Promise.all(
        movies.map(async (movie: any) => {
          try {
            const videos = await tmdbFetch(
              `/movie/${movie.id}/videos`,
            );

            const trailers =
              (videos.results || [])
                .filter(
                  (v: any) =>
                    v.site === "YouTube",
                )
                .slice(0, 3);

            return {
              id: movie.id,
              title: movie.title,
              overview:
                movie.overview || "",

              year: movie.release_date
                ? Number(
                    movie.release_date.slice(
                      0,
                      4,
                    ),
                  )
                : null,

              rating: Number(
                movie.vote_average?.toFixed(
                  1,
                ),
              ),

              popularity:
                movie.popularity,

              language: langName(
                movie.original_language,
              ),

              poster:
                movie.poster_path
                  ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                  : null,

              backdrop:
                movie.backdrop_path
                  ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
                  : null,

              trailers: trailers.map(
                (t: any) => ({
                  key: t.key,
                  name: t.name,
                  type: t.type,
                }),
              ),
            };
          } catch {
            return null;
          }
        }),
      );

    const items =
      enrichedMovies.filter(Boolean);

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        page,
        totalResults:
          response.total_results || 0,
        totalPages:
          response.total_pages || 0,
        hasMore:
          page <
          (response.total_pages || 1),
        items,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      },
    );
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
        items: [],
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      },
    );
  }
});