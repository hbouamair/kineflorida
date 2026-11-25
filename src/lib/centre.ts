import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type Centre = {
  address: string;
  phone: string;
  instagram: string;
  email: string;
};

export const defaultCentre: Centre = {
  address: "Lotissement El Fath 2, Rue 56 N° 78, Sidi Maarouf, Casablanca 20270",
  phone: "05 22 78 63 29",
  instagram: "https://www.instagram.com/florida.kine/",
  email: "",
};

export function phoneHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("212")) return `tel:+${digits}`;
  if (digits.startsWith("0")) return `tel:+212${digits.slice(1)}`;
  return digits ? `tel:+${digits}` : "tel:+212522786329";
}

export function instagramHref(value: string) {
  const text = value.trim();
  if (!text) return defaultCentre.instagram;
  if (text.startsWith("http://") || text.startsWith("https://")) return text;
  return `https://www.instagram.com/${text.replace(/^@/, "")}/`;
}

export function instagramLabel(value: string) {
  const handle = instagramHref(value).replace(/\/$/, "").split("/").pop() || "florida.kine";
  return `@${handle}`;
}

export async function loadCentre(): Promise<{ centre: Centre; ready: boolean }> {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.from("centre_settings").select("address, phone, instagram, email").eq("id", 1).maybeSingle();
    if (error) return { centre: defaultCentre, ready: false };
    if (!data) return { centre: defaultCentre, ready: true };
    return {
      ready: true,
      centre: {
        address: String(data.address || defaultCentre.address),
        phone: String(data.phone || defaultCentre.phone),
        instagram: String(data.instagram || defaultCentre.instagram),
        email: String(data.email ?? "").trim(),
      },
    };
  } catch {
    return { centre: defaultCentre, ready: false };
  }
}
