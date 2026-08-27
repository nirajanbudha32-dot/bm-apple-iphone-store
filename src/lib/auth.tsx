import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, AuthError } from "@supabase/supabase-js";
import { supabase, type Profile } from "@/lib/supabase";

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AUTH_ENABLED = true;

function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) {
        console.error("[BM Store] fetchProfile error:", error.message);
      }
      if (data) {
        setProfile({
          id: data.id,
          email: data.email,
          role: data.role,
          storeId: data.store_id ?? null,
          created_at: data.created_at,
        } as Profile);
      } else {
        console.error("[BM Store] No profile found for user. Profile must be created via SQL.");
        setProfile(null);
      }
    } catch (err) {
      console.error("[BM Store] fetchProfile exception:", err);
      setProfile(null);
    }
  }

  async function refreshProfile() {
    if (!user) return;
    await fetchProfile(user.id);
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id).finally(() => {
            if (mounted) setLoading(false);
          });
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("[BM Store] getSession error:", err);
        if (mounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (err) {
      console.error("[BM Store] signIn exception:", err);
      return { error: { message: err instanceof Error ? err.message : "Sign in failed" } as AuthError };
    }
  }

  async function signUp(_email: string, _password: string, _asAdmin = false) {
    return { error: { message: "Account creation is disabled. Contact admin to create accounts via SQL." } as AuthError };
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[BM Store] signOut error:", err);
    }
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!AUTH_ENABLED) {
    return (
      <AuthContext.Provider
        value={{
          user: null,
          profile: null,
          loading: false,
          signIn: async () => ({ error: null }),
          signUp: async () => ({ error: null }),
          signOut: async () => {},
          refreshProfile: async () => {},
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }
  return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
