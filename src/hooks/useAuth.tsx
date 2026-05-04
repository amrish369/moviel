import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Ctx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({ user: null, session: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
      if (s?.user) {
        // migrate localStorage likes after login
        setTimeout(() => migrateLocalLikes(s.user.id), 0);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <AuthCtx.Provider value={{ user: session?.user ?? null, session, loading, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);

async function migrateLocalLikes(userId: string) {
  try {
    const flag = `cineradar:migrated:${userId}`;
    if (localStorage.getItem(flag)) return;
    const likesRaw = localStorage.getItem("cineradar:feed:likes");
    const ids: number[] = likesRaw ? JSON.parse(likesRaw) : [];
    if (ids.length) {
      const rows = ids.map((id) => ({ user_id: userId, movie_id: id }));
      await supabase.from("user_likes").upsert(rows, { onConflict: "user_id,movie_id" });
    }
    localStorage.setItem(flag, "1");
  } catch (e) { console.warn("migrate likes failed", e); }
}