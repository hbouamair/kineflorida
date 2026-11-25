import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { resilientFetch } from "@/lib/supabase/fetch";

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const response = NextResponse.json({ ok: true });

  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    global: { fetch: resilientFetch },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...options,
            path: options?.path ?? "/",
            sameSite: options?.sameSite ?? "lax",
            secure: process.env.NODE_ENV === "production",
          });
        });
      },
    },
  });

  await supabase.auth.signOut();
  return response;
}
