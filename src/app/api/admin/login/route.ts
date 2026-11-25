import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { resilientFetch } from "@/lib/supabase/fetch";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Email et mot de passe requis." }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return NextResponse.json({ ok: false, error: "Configuration Supabase manquante." }, { status: 500 });
    }

    const response = NextResponse.json({ ok: true });
    let cookiesWritten = 0;

    const supabase = createServerClient(url, key, {
      global: { fetch: resilientFetch },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesWritten += cookiesToSet.length;
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

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const isNetwork = /fetch failed|ECONNRESET|ENOTFOUND|ETIMEDOUT|certificate|network/i.test(error.message);
      const message = isNetwork
        ? "Impossible de joindre Supabase depuis ce réseau."
        : error.message.includes("Invalid login credentials")
          ? "Email ou mot de passe incorrect."
          : error.message.includes("Email not confirmed")
            ? "Confirmez l'email dans Supabase, ou recréez l'utilisateur avec Auto Confirm."
            : error.message;
      return NextResponse.json({ ok: false, error: message }, { status: isNetwork ? 503 : 401 });
    }

    if (!data.session || !data.user) {
      return NextResponse.json({ ok: false, error: "Session non créée." }, { status: 401 });
    }

    if (cookiesWritten === 0) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    }

    if (cookiesWritten === 0) {
      return NextResponse.json(
        { ok: false, error: "La session n'a pas été enregistrée dans le navigateur." },
        { status: 500 },
      );
    }

    return response;
  } catch {
    return NextResponse.json({ ok: false, error: "Erreur serveur lors de la connexion." }, { status: 500 });
  }
}
