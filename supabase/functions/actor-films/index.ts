import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w300";
const TMDB_PROFILE = "https://image.tmdb.org/t/p/w300";

function tmdbAuth() {
  const key = Deno.env.get("TMDB_API_KEY") || "";
  if (key.startsWith("eyJ") || key.length > 60) {
    return { headers: { Authorization: `Bearer ${key}` }, keyParam: "" };
  }
  return { headers: {}, keyParam: key };
}

async function tmdbFetch(path: string, query: Record<string, string> = {}) {
  const auth = tmdbAuth();
  const params = new URLSearchParams(query);
  if (auth.keyParam) params.set("api_key", auth.keyParam);
  const res = await fetch(`${TMDB_BASE}${path}?${params}`, { headers: auth.headers });
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!Deno.env.get("TMDB_API_KEY")) throw new Error("TMDB_API_KEY is not configured");
    const { name } = await req.json().catch(() => ({}));
    if (!name || typeof name !== "string") throw new Error("Missing actor name");

    // 1) Search the person
    const search = await tmdbFetch("/search/person", { query: name, include_adult: "false" });
    const person = (search.results || []).sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))[0];
    if (!person) throw new Error(`No actor found for "${name}"`);

    // 2) Person details + movie credits in parallel
    const [details, credits] = await Promise.all([
      tmdbFetch(`/person/${person.id}`, {}),
      tmdbFetch(`/person/${person.id}/movie_credits`, {}),
    ]);

    const today = new Date().toISOString().substring(0, 10);

    // De-duplicate credits by movie id
    const seen = new Set<number>();
    const cast = (credits.cast || []).filter((c: any) => {
      if (!c || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });

    const mapped = cast.map((c: any) => ({
      id: c.id,
      title: c.title || c.original_title,
      character: c.character || "",
      releaseDate: c.release_date || "",
      year: c.release_date ? parseInt(c.release_date.substring(0, 4)) : null,
      poster: c.poster_path ? `${TMDB_IMG}${c.poster_path}` : null,
      rating: Math.round((c.vote_average || 0) * 10) / 10,
      voteCount: c.vote_count || 0,
      popularity: c.popularity || 0,
      language: c.original_language,
      overview: c.overview || "",
    }));

    const released = mapped
      .filter((m: any) => m.releaseDate && m.releaseDate <= today)
      .sort((a: any, b: any) => (a.releaseDate < b.releaseDate ? 1 : -1));
    const upcoming = mapped
      .filter((m: any) => m.releaseDate && m.releaseDate > today)
      .sort((a: any, b: any) => (a.releaseDate < b.releaseDate ? -1 : 1));

    const topRated = [...released]
      .filter((m: any) => m.voteCount >= 50)
      .sort((a: any, b: any) => b.rating - a.rating)
      .slice(0, 10);

    const actor = {
      id: person.id,
      name: details.name,
      profile: details.profile_path ? `${TMDB_PROFILE}${details.profile_path}` : null,
      biography: details.biography || "",
      birthday: details.birthday || null,
      placeOfBirth: details.place_of_birth || null,
      knownForDepartment: details.known_for_department || "Acting",
      popularity: details.popularity || 0,
      totalMovies: mapped.length,
      releasedCount: released.length,
      upcomingCount: upcoming.length,
    };

    return new Response(JSON.stringify({ actor, released, upcoming, topRated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("actor-films error:", error);
    return new Response(JSON.stringify({ error: "An error occurred. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});