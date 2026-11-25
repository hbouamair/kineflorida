export function supabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL manquant.");
  return url;
}

export function supabasePublishableKey() {
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();
  if (!key) throw new Error("Clé publishable manquante.");
  return key;
}

export function supabaseSecretKey() {
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!key || key.startsWith("sb_publishable_")) {
    throw new Error("SUPABASE_SECRET_KEY manquant ou incorrect.");
  }
  return key;
}
