import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title } = await req.json();
    if (!title || typeof title !== "string" || title.trim().length < 1) {
      return new Response(JSON.stringify({ error: "Movie title is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OMDB_API_KEY = Deno.env.get("OMDB_API_KEY");
    if (!OMDB_API_KEY) throw new Error("OMDB_API_KEY is not configured");

    // Fetch full movie details from OMDb
    const params = new URLSearchParams({ apikey: OMDB_API_KEY, t: title.trim(), plot: "full" });
    const res = await fetch(`https://www.omdbapi.com/?${params}`);
    const d = await res.json();

    if (d.Response === "False") {
      return new Response(JSON.stringify({
        fallback: true,
        message: d.Error || "Movie not found",
        title: title.trim(),
        year: new Date().getFullYear(),
        genre: "Unknown",
        imdb: 0,
        language: "Unknown",
        plot: "Movie not found in database.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse cast into structured format
    const castList = d.Actors && d.Actors !== "N/A"
      ? d.Actors.split(", ").map((name: string) => ({
          name,
          character: "N/A",
          photoQuery: `${name} actor headshot`,
        }))
      : [];

    // Parse writers
    const writersList = d.Writer && d.Writer !== "N/A"
      ? d.Writer.split(", ").map((w: string) => {
          const match = w.match(/^(.+?)\s*\((.+?)\)$/);
          return match
            ? { name: match[1], role: match[2] }
            : { name: w, role: "Writer" };
        })
      : [];

    const movieData = {
      title: d.Title,
      year: parseInt(d.Year) || 0,
      genre: d.Genre || "N/A",
      imdb: parseFloat(d.imdbRating) || 0,
      runtime: d.Runtime || null,
      certification: d.Rated || null,
      language: d.Language || "N/A",
      country: d.Country || null,
      tagline: null,
      plot: d.Plot || null,
      director: d.Director && d.Director !== "N/A"
        ? { name: d.Director, knownFor: [] }
        : null,
      writers: writersList,
      cast: castList,
      producers: d.Production && d.Production !== "N/A" ? [d.Production] : [],
      music: null,
      cinematography: null,
      platform: d.Type === "series" ? "Streaming" : "Theatrical",
      boxOffice: {
        budget: null,
        openingDay: null,
        totalIndia: null,
        totalWorldwide: d.BoxOffice && d.BoxOffice !== "N/A" ? d.BoxOffice : null,
        verdict: null,
      },
      ratings: {
        imdb: parseFloat(d.imdbRating) || null,
        rottenTomatoes: d.Ratings?.find((r: any) => r.Source === "Rotten Tomatoes")?.Value || null,
        audienceScore: null,
      },
      trailerQuery: `${d.Title} ${d.Year} official trailer youtube`,
      poster: d.Poster && d.Poster !== "N/A" ? d.Poster : null,
      similarMovies: [],
    };

    return new Response(JSON.stringify(movieData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("movie-detail error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
