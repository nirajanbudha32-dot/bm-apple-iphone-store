import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, AuthError } from "@supabase/supabase-js";
import { supabase, type Profile } from "@/lib/supabase";

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    asAdmin?: boolean,
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Login system disabled: the app runs as a local admin session with no sign-in.
export const AUTH_ENABLED = true;

const GUEST_USER = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "admin@bmstore.com",
} as unknown as User;

const GUEST_PROFILE: Profile = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "admin@bmstore.com",
  role: "admin",
  created_at: new Date(0).toISOString(),
};

function GuestAuthProvider({ children }: { children: ReactNode }) {
  const noop = async () => ({ error: null });
  return (
    <AuthContext.Provider
      value={{
        user: GUEST_USER,
        profile: GUEST_PROFILE,
        loading: false,
        signIn: noop,
        signUp: noop,
        signOut: async () => {},
        refreshProfile: async () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!AUTH_ENABLED) return <GuestAuthProvider>{children}</GuestAuthProvider>;
  return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
}

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
        setProfile(data as Profile);
      } else {
        // Auto-heal missing profile row
        const { data: userData } = await supabase.auth.getUser();
        const currentUser = userData?.user;
        if (currentUser) {
          const role: "admin" | "salesman" = currentUser.email === "admin@bmstore.com" ? "admin" : "salesman";
          const fallbackProfile: Profile = {
            id: currentUser.id,
            email: currentUser.email || "",
            role,
            created_at: new Date().toISOString(),
          };
          await supabase.from("profiles").upsert({
            id: currentUser.id,
            email: currentUser.email || "",
            role,
          });
          setProfile(fallbackProfile);
        } else {
          setProfile(null);
        }
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

  async function signUp(email: string, password: string, asAdmin = false) {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) return { error };

      const {
        data: { user: newUser },
      } = await supabase.auth.getUser();
      if (newUser) {
        const role: "admin" | "salesman" = (asAdmin || email === "admin@bmstore.com") ? "admin" : "salesman";
        await supabase.from("profiles").upsert({
          id: newUser.id,
          email: newUser.email!,
          role,
        });
      }

      return { error: null };
    } catch (err) {
      console.error("[BM Store] signUp exception:", err);
      return { error: { message: err instanceof Error ? err.message : "Sign up failed" } as AuthError };
    }
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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
