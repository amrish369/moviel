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
    const { title, year } = await req.json();
    if (!title || typeof title !== "string" || title.trim().length < 1) {
      return new Response(JSON.stringify({ error: "title is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OMDB_API_KEY = Deno.env.get("OMDB_API_KEY");
    if (!OMDB_API_KEY) throw new Error("OMDB_API_KEY not configured");

    const params = new URLSearchParams({ apikey: OMDB_API_KEY, t: title.trim() });
    if (year) params.set("y", String(year));

    const res = await fetch(`https://www.omdbapi.com/?${params}`);
    const data = await res.json();

    if (data.Response === "True" && data.Poster && data.Poster !== "N/A") {
      return new Response(JSON.stringify({ imageUrl: data.Poster }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No poster found
    return new Response(JSON.stringify({ fallback: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("movie-poster error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", fallback: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
