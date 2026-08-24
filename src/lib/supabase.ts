import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env['VITE_SUPABASE_URL'] as string;
const supabaseAnonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'] as string;

const url = supabaseUrl || "https://moavwfubvalkxgfcntmy.supabase.co";
const key = supabaseAnonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vYXZ3ZnVidmFsa3hnZmNudG15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NDQ3ODMsImV4cCI6MjEwMzEyMDc4M30.I4NHV1U-Qe_OvUjShXgxAqpc90BY11U3tUWE3Y6f6B8";

export const supabase: SupabaseClient = createClient(url, key);

export type UserRole = "admin" | "salesman";

export type Profile = {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
};
