import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env['VITE_SUPABASE_URL'] as string;
const supabaseAnonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'] as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("[BM Store] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
}

export const supabase: SupabaseClient = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");

export type UserRole = "admin" | "salesman";

export type Profile = {
  id: string;
  email: string;
  role: UserRole;
  storeId: string | null;
  created_at: string;
};
