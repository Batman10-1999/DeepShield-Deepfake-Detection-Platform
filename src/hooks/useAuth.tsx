// Real Supabase-backed authentication context.
// The session is the single source of truth for "who is signed in" — there is
// no fake/local auth anywhere in DeepShield.

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { analysisStore } from "@/lib/analysisStore";
import { clearRememberSession, shouldDiscardStoredSession } from "@/lib/session";

interface AuthState {
  session: Session | null;
  user: User | null;
  displayName: string;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  displayName: "",
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Register the listener first so no auth event is missed during startup.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
      analysisStore.setUser(next?.user?.id ?? null);
    });
    void supabase.auth.getSession().then(async ({ data }) => {
      // "Remember me" opt-out: drop sessions carried over from a previous
      // browser session instead of silently signing the user back in.
      if (data.session && shouldDiscardStoredSession()) {
        await supabase.auth.signOut();
        setSession(null);
        setLoading(false);
        analysisStore.setUser(null);
        return;
      }
      setSession(data.session);
      setLoading(false);
      analysisStore.setUser(data.session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthState>(() => {
    const user = session?.user ?? null;
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const displayName =
      (typeof meta["display_name"] === "string" && meta["display_name"]) ||
      (typeof meta["full_name"] === "string" && meta["full_name"]) ||
      (user?.email ? user.email.split("@")[0]! : "") ||
      "";
    return {
      session,
      user,
      displayName,
      loading,
      signOut: async () => {
        analysisStore.setUser(null);
        clearRememberSession();
        await supabase.auth.signOut();
      },
    };
  }, [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
