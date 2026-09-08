import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const newToken = () =>
  crypto.randomUUID().replace(/-/g, "").slice(0, 16);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "");

    // 1) Bot creates a token before sending the user to the website
    if (action === "create") {
      const movie_slug = typeof body.movie_slug === "string" ? body.movie_slug.slice(0, 200) : null;
      const chat_id = body.chat_id != null ? String(body.chat_id).slice(0, 64) : null;
      const token = newToken();
      const { error } = await supabase.from("unlock_tokens").insert({ token, movie_slug, chat_id });
      if (error) return json({ error: "Could not create token" }, 500);
      return json({ token, url: `https://moviel.lovable.app/verify?t=${token}` });
    }

    // 2) Website marks the token verified after the ad steps
    if (action === "verify") {
      const token = String(body.token || "").slice(0, 64);
      if (!token) return json({ error: "Missing token" }, 400);
      const { data, error } = await supabase
        .from("unlock_tokens")
        .select("id, verified, expires_at, movie_slug")
        .eq("token", token)
        .maybeSingle();
      if (error) return json({ error: "Lookup failed" }, 500);
      if (!data) return json({ error: "Invalid code" }, 404);
      if (new Date(data.expires_at) < new Date()) return json({ error: "Code expired" }, 410);
      if (!data.verified) {
        await supabase
          .from("unlock_tokens")
          .update({ verified: true, verified_at: new Date().toISOString() })
          .eq("id", data.id);
      }
      return json({ ok: true, verified: true, movie_slug: data.movie_slug });
    }

    // 3) Bot checks whether the user completed verification
    if (action === "status") {
      const token = String(body.token || "").slice(0, 64);
      if (!token) return json({ error: "Missing token" }, 400);
      const { data } = await supabase
        .from("unlock_tokens")
        .select("verified, expires_at, movie_slug, chat_id")
        .eq("token", token)
        .maybeSingle();
      if (!data) return json({ verified: false, found: false });
      const expired = new Date(data.expires_at) < new Date();
      return json({
        found: true,
        verified: data.verified && !expired,
        expired,
        movie_slug: data.movie_slug,
        chat_id: data.chat_id,
      });
    }

    return json({ error: "Unknown action" }, 400);
  } catch {
    return json({ error: "Request failed" }, 500);
  }
});
