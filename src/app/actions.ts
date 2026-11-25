"use server";

import { findService } from "@/content/catalog";
import { isLang } from "@/lib/i18n";
import { buildSlots, isDay } from "@/lib/slots";
import { getSupabase } from "@/lib/supabase";

export type BookState = { ok: true } | { ok: false; message: string } | null;

export async function loadBlocks(day: string) {
  if (!isDay(day)) return { configured: false as const, blocks: [] };
  const supabase = await getSupabase();
  if (!supabase) return { configured: false as const, blocks: [] };
  const start = new Date(`${day}T00:00:00+01:00`).toISOString();
  const end = new Date(`${day}T23:59:59+01:00`).toISOString();
  const { data, error } = await supabase
    .from("appointment_slots")
    .select("starts_at, ends_at")
    .gte("starts_at", start)
    .lte("starts_at", end);
  if (error) {
    return { configured: true as const, blocks: [], error: "unreachable" as const };
  }
  return { configured: true as const, blocks: data ?? [] };
}

export async function bookAppointment(_prev: BookState, formData: FormData): Promise<BookState> {
  const lang = String(formData.get("lang") ?? "");
  const serviceId = String(formData.get("service") ?? "");
  const day = String(formData.get("day") ?? "");
  const startIso = String(formData.get("start") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").replace(/[^\d+]/g, "");
  const fr = lang !== "ar";

  const service = findService(serviceId);
  if (!isLang(lang) || !service || service.minutes === null) {
    return { ok: false, message: fr ? "Ce soin ne peut pas être réservé." : "لا يمكن حجز هذا العلاج." };
  }
  if (!isDay(day) || !startIso) {
    return { ok: false, message: fr ? "Choisissez un jour et un créneau." : "اختاروا يوماً وموعداً." };
  }
  if (name.length < 2) {
    return { ok: false, message: fr ? "Indiquez votre nom." : "اكتبوا الاسم." };
  }
  if (phone.replace(/\D/g, "").length < 8) {
    return { ok: false, message: fr ? "Indiquez un téléphone." : "اكتبوا رقم الهاتف." };
  }

  const supabase = await getSupabase();
  if (!supabase) {
    return {
      ok: false,
      message: fr
        ? "L'agenda n'est pas relié. Les clés Supabase manquent."
        : "جدول المواعيد غير موصول. مفاتيح Supabase ناقصة.",
    };
  }

  const loaded = await loadBlocks(day);
  const slots = buildSlots(day, service.minutes, loaded.blocks, fr ? "fr-MA" : "ar-MA");
  const slot = slots.find((item) => item.iso === startIso && item.free);
  if (!slot) {
    return { ok: false, message: fr ? "Ce créneau n'est plus libre." : "هذا الموعد لم يعد متاحاً." };
  }

  const ends = new Date(new Date(slot.iso).getTime() + service.minutes * 60_000).toISOString();
  const { error } = await supabase.from("appointments").insert({
    service_id: service.id,
    starts_at: slot.iso,
    ends_at: ends,
    patient_name: name,
    patient_phone: phone,
    locale: lang,
  });

  if (error) {
    return { ok: false, message: fr ? "Le créneau n'a pas pu être enregistré." : "تعذر تسجيل الموعد." };
  }
  return { ok: true };
}
