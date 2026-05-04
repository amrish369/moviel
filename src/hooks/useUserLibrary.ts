import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toggleLike as lsToggleLike, getLikes as lsGetLikes } from "@/hooks/useFeedTracking";

const WL_KEY = "cineradar:watchlist";

function lsGetWatchlist(): number[] {
  try { return JSON.parse(localStorage.getItem(WL_KEY) || "[]"); } catch { return []; }
}
function lsSetWatchlist(ids: number[]) {
  try { localStorage.setItem(WL_KEY, JSON.stringify(ids)); } catch {}
}

export type LibraryItem = { id: number; title?: string; poster?: string | null; year?: number | null };

export function useUserLibrary() {
  const { user } = useAuth();
  const [likes, setLikes] = useState<number[]>([]);
  const [watchlist, setWatchlist] = useState<number[]>([]);

  const refresh = useCallback(async () => {
    if (user) {
      const [{ data: l }, { data: w }] = await Promise.all([
        supabase.from("user_likes").select("movie_id").eq("user_id", user.id),
        supabase.from("user_watchlist").select("movie_id").eq("user_id", user.id),
      ]);
      setLikes((l || []).map((r: any) => r.movie_id));
      setWatchlist((w || []).map((r: any) => r.movie_id));
    } else {
      setLikes(lsGetLikes());
      setWatchlist(lsGetWatchlist());
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggleLike = useCallback(async (item: LibraryItem & { genreIds?: number[]; langCode?: string }) => {
    if (user) {
      const isLiked = likes.includes(item.id);
      if (isLiked) {
        await supabase.from("user_likes").delete().eq("user_id", user.id).eq("movie_id", item.id);
        setLikes((p) => p.filter((x) => x !== item.id));
        return false;
      }
      await supabase.from("user_likes").upsert({ user_id: user.id, movie_id: item.id, movie_data: item }, { onConflict: "user_id,movie_id" });
      setLikes((p) => [...p, item.id]);
      return true;
    }
    const liked = lsToggleLike(item as any);
    setLikes(lsGetLikes());
    return liked;
  }, [user, likes]);

  const toggleWatchlist = useCallback(async (item: LibraryItem) => {
    if (user) {
      const inList = watchlist.includes(item.id);
      if (inList) {
        await supabase.from("user_watchlist").delete().eq("user_id", user.id).eq("movie_id", item.id);
        setWatchlist((p) => p.filter((x) => x !== item.id));
        return false;
      }
      await supabase.from("user_watchlist").upsert({ user_id: user.id, movie_id: item.id, movie_data: item }, { onConflict: "user_id,movie_id" });
      setWatchlist((p) => [...p, item.id]);
      return true;
    }
    const cur = lsGetWatchlist();
    const idx = cur.indexOf(item.id);
    if (idx >= 0) cur.splice(idx, 1); else cur.push(item.id);
    lsSetWatchlist(cur);
    setWatchlist([...cur]);
    return idx < 0;
  }, [user, watchlist]);

  return { likes, watchlist, toggleLike, toggleWatchlist, refresh, isLoggedIn: !!user };
}

export async function fetchWatchlistDetails(user_id: string) {
  const { data } = await supabase.from("user_watchlist")
    .select("movie_id, movie_data, created_at")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });
  return data || [];
}

export function getLocalWatchlistIds() { return lsGetWatchlist(); }