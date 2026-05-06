import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Bookmark, LogOut, User as UserIcon, Loader2, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useUserLibrary, fetchWatchlistDetails } from "@/hooks/useUserLibrary";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { likes, watchlist } = useUserLibrary();
  const [tab, setTab] = useState<"likes" | "watchlist">("likes");
  const [items, setItems] = useState<any[]>([]);
  const [profile, setProfile] = useState<{ display_name: string; avatar_url: string }>({ display_name: "", avatar_url: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading && !user) navigate("/auth"); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, avatar_url").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => data && setProfile({ display_name: data.display_name || "", avatar_url: data.avatar_url || "" }));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const table = tab === "likes" ? "user_likes" : "user_watchlist";
      const { data } = await supabase.from(table).select("movie_id, movie_data, created_at")
        .eq("user_id", user.id).order("created_at", { ascending: false });
      setItems((data || []).map((r: any) => ({ id: r.movie_id, ...(r.movie_data || {}) })));
    })();
  }, [user, tab, likes.length, watchlist.length]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Profile updated");
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="w-9 h-9 rounded-lg bg-secondary/60 hover:bg-secondary flex items-center justify-center">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="font-display text-lg font-bold text-gradient-gold">My Dashboard</h1>
          </div>
          <button onClick={() => { signOut(); navigate("/"); }} className="flex items-center gap-1 text-xs px-3 h-9 rounded-lg bg-secondary/60 hover:bg-secondary">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Profile */}
        <section className="glass-card rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center overflow-hidden border border-primary/30">
              {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <UserIcon className="w-7 h-7 text-primary" />}
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-base font-bold text-foreground truncate">{profile.display_name || user.email}</h2>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-secondary/40 p-3 text-center">
              <p className="text-2xl font-bold text-primary">{likes.length}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Liked</p>
            </div>
            <div className="rounded-lg bg-secondary/40 p-3 text-center">
              <p className="text-2xl font-bold text-primary">{watchlist.length}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Watchlist</p>
            </div>
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Edit profile</summary>
            <div className="mt-3 space-y-3">
              <div className="space-y-1">
                <Label htmlFor="dn" className="text-xs">Display name</Label>
                <Input id="dn" value={profile.display_name} onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="av" className="text-xs">Avatar URL</Label>
                <Input id="av" value={profile.avatar_url} onChange={(e) => setProfile((p) => ({ ...p, avatar_url: e.target.value }))} placeholder="https://..." />
              </div>
              <Button size="sm" onClick={saveProfile} disabled={saving}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
              </Button>
            </div>
          </details>
        </section>

        {/* Tabs */}
        <div className="flex gap-2">
          <button onClick={() => setTab("likes")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${tab === "likes" ? "bg-primary/15 text-primary border border-primary/30" : "bg-secondary text-muted-foreground"}`}>
            <Heart className="w-3.5 h-3.5" /> Liked ({likes.length})
          </button>
          <button onClick={() => setTab("watchlist")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${tab === "watchlist" ? "bg-primary/15 text-primary border border-primary/30" : "bg-secondary text-muted-foreground"}`}>
            <Bookmark className="w-3.5 h-3.5" /> Watchlist ({watchlist.length})
          </button>
        </div>

        {items.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="text-sm text-muted-foreground">Nothing here yet.</p>
            <Link to="/" className="text-xs text-primary underline mt-2 inline-block">Discover movies</Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((it) => (
              <article key={it.id} onClick={() => navigate(`/movie?title=${encodeURIComponent(it.title || "")}`)}
                className="glass-card rounded-xl p-3 flex gap-3 items-center cursor-pointer hover:border-primary/40 transition">
                {it.poster && <img src={it.poster} alt={it.title} className="w-14 h-20 object-cover rounded-md" loading="lazy" />}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-sm font-bold text-foreground truncate">{it.title || `Movie #${it.id}`}</h3>
                  {it.year && <p className="text-[11px] text-muted-foreground">{it.year}{it.language ? ` • ${it.language}` : ""}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;