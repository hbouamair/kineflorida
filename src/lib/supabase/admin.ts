import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseSecretKey, supabaseUrl } from "./env";
import { resilientFetch } from "./fetch";

/** Server only. Bypasses RLS, same role as the studio_dance service key. */
export function getSupabaseAdmin(): SupabaseClient {
  return createClient(supabaseUrl(), supabaseSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: resilientFetch },
  });
}
