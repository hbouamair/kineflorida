"use server";

import { revalidatePath } from "next/cache";
import { bookingStatuses, paymentStatuses, type Booking, type BookingStatus, type PaymentStatus } from "@/lib/booking";
import { sendConfirmedMail } from "@/lib/mail";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServer } from "@/lib/supabase/server";

async function requireStaff() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("auth");
  return user;
}

function refresh() {
  revalidatePath("/admin");
  revalidatePath("/admin/horaires");
  revalidatePath("/admin/parametres");
  revalidatePath("/admin/revenus");
  revalidatePath("/admin/catalogue");
  revalidatePath("/fr/soins");
  revalidatePath("/ar/soins");
  revalidatePath("/fr/packs");
  revalidatePath("/ar/packs");
  revalidatePath("/fr/rendez-vous");
  revalidatePath("/ar/rendez-vous");
  revalidatePath("/fr/contact");
  revalidatePath("/ar/contact");
  revalidatePath("/fr");
  revalidatePath("/ar");
}

function slug(value: string) {
  const base = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36);
  return `${base || "item"}-${Math.random().toString(36).slice(2, 6)}`;
}

function minutesOf(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

function clock(value: FormDataEntryValue | null) {
  const match = String(value ?? "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  return minutes >= 0 && minutes <= 24 * 60 ? minutes : null;
}

export async function setBookingStatus(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as BookingStatus;
  if (!id || !bookingStatuses.includes(status)) return;
  const admin = getSupabaseAdmin();
  const existing = await admin.from("bookings").select("*").eq("id", id).single();
  await admin.from("bookings").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (status === "confirmed" && existing.data && existing.data.status !== "confirmed") {
    await sendConfirmedMail(existing.data as Booking);
  }
  refresh();
}

export async function setPaymentStatus(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const payment = String(formData.get("payment") ?? "") as PaymentStatus;
  if (!id || !paymentStatuses.includes(payment)) return;
  const admin = getSupabaseAdmin();
  await admin.from("bookings").update({ payment_status: payment, updated_at: new Date().toISOString() }).eq("id", id);
  refresh();
}

function hourRows(formData: FormData) {
  return Array.from({ length: 7 }, (_, weekday) => {
    const open = clock(formData.get(`from-${weekday}`)) ?? 9 * 60;
    const close = clock(formData.get(`to-${weekday}`)) ?? 18 * 60;
    return {
      weekday,
      is_open: formData.get(`open-${weekday}`) === "1",
      open_minutes: Math.min(open, close),
      close_minutes: Math.max(open, close),
    };
  });
}

export async function saveHours(formData: FormData) {
  await requireStaff();
  const admin = getSupabaseAdmin();
  await admin.from("opening_hours").upsert(hourRows(formData));
  refresh();
}

function placePayload(formData: FormData) {
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const instagram = String(formData.get("instagram") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (address.length < 8 || phone.replace(/\D/g, "").length < 8) return null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return {
    id: 1,
    address,
    phone,
    instagram: instagram || "https://www.instagram.com/florida.kine/",
    email,
  };
}

export async function savePlace(formData: FormData) {
  await requireStaff();
  const place = placePayload(formData);
  if (!place) return;
  const admin = getSupabaseAdmin();
  await admin.from("centre_settings").upsert(place);
  refresh();
}

export async function saveSettings(formData: FormData) {
  await requireStaff();
  const place = placePayload(formData);
  if (!place) return;
  const admin = getSupabaseAdmin();
  await admin.from("centre_settings").upsert(place);
  await admin.from("opening_hours").upsert(hourRows(formData));
  refresh();
}

function servicePayload(formData: FormData) {
  const nameFr = String(formData.get("name_fr") ?? "").trim();
  const nameAr = String(formData.get("name_ar") ?? "").trim() || nameFr;
  const family = String(formData.get("family") ?? "");
  const price = Number(formData.get("price"));
  if (!nameFr || !["kine", "slim", "body", "face", "water"].includes(family) || !Number.isFinite(price) || price < 0) return null;
  return {
    family,
    name_fr: nameFr,
    name_ar: nameAr,
    minutes: minutesOf(formData.get("minutes")),
    price_mad: Math.round(price),
  };
}

function packPayload(formData: FormData) {
  const nameFr = String(formData.get("name_fr") ?? "").trim();
  const nameAr = String(formData.get("name_ar") ?? "").trim() || nameFr;
  const detailFr = String(formData.get("detail_fr") ?? "").trim();
  const detailAr = String(formData.get("detail_ar") ?? "").trim() || detailFr;
  const amount = Number(formData.get("amount"));
  const labelFr = String(formData.get("label_fr") ?? "").trim();
  if (!nameFr || !detailFr || !labelFr || !Number.isFinite(amount) || amount < 0) return null;
  const prices = [{ label_fr: labelFr, label_ar: String(formData.get("label_ar") ?? "").trim() || labelFr, amount: Math.round(amount) }];
  const second = Number(formData.get("amount_2"));
  const label2 = String(formData.get("label_fr_2") ?? "").trim();
  if (label2 && Number.isFinite(second) && second >= 0) {
    prices.push({ label_fr: label2, label_ar: String(formData.get("label_ar_2") ?? "").trim() || label2, amount: Math.round(second) });
  }
  return {
    name_fr: nameFr,
    name_ar: nameAr,
    detail_fr: detailFr,
    detail_ar: detailAr,
    minutes: minutesOf(formData.get("minutes")),
    prices,
  };
}

export async function addService(formData: FormData) {
  await requireStaff();
  const payload = servicePayload(formData);
  if (!payload) return;
  const admin = getSupabaseAdmin();
  await admin.from("added_services").insert({ id: slug(payload.name_fr), ...payload });
  refresh();
}

export async function updateService(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const payload = servicePayload(formData);
  if (!id || !payload) return;
  const admin = getSupabaseAdmin();
  await admin.from("added_services").update(payload).eq("id", id);
  refresh();
}

export async function addPack(formData: FormData) {
  await requireStaff();
  const payload = packPayload(formData);
  if (!payload) return;
  const admin = getSupabaseAdmin();
  await admin.from("added_packs").insert({ id: slug(payload.name_fr), ...payload });
  refresh();
}

export async function updatePack(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const payload = packPayload(formData);
  if (!id || !payload) return;
  const admin = getSupabaseAdmin();
  await admin.from("added_packs").update(payload).eq("id", id);
  refresh();
}

export async function removeAdded(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const kind = String(formData.get("kind") ?? "");
  if (!id || (kind !== "service" && kind !== "pack")) return;
  const admin = getSupabaseAdmin();
  await admin.from(kind === "service" ? "added_services" : "added_packs").delete().eq("id", id);
  refresh();
}
