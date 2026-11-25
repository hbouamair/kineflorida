import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { resilientFetch } from "@/lib/supabase/fetch";

function publishableKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function agendaConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && publishableKey());
}

export async function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = publishableKey();
  if (!url || !key) return null;
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    global: { fetch: resilientFetch },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => undefined,
    },
  });
}
