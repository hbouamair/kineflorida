import type { Booking } from "@/lib/booking";
import { minutesLabel } from "@/lib/agenda";
import { loadCentre } from "@/lib/centre";
import { resilientFetch } from "@/lib/supabase/fetch";

const CENTRE = "Centre Kinésithérapie Florida";

function deadline(from = new Date()) {
  return new Date(from.getTime() + 48 * 60 * 60 * 1000);
}

function when(value: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : "fr-MA", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Casablanca",
  }).format(value);
}

async function shell(body: string) {
  const { centre } = await loadCentre();
  const mail = centre.email ? `<br>${centre.email}` : "";
  return `<div style="font-family:sans-serif;color:#2a241c;line-height:1.5">${body}<p style="margin-top:24px">Centre Kinésithérapie Florida<br>${centre.address}<br>${centre.phone}${mail}</p></div>`;
}

async function send(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  if (!key || !from) return "skipped" as const;
  try {
    const response = await resilientFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    return response.ok ? ("sent" as const) : ("failed" as const);
  } catch {
    return "failed" as const;
  }
}

export function payBy(from = new Date()) {
  return deadline(from).toISOString();
}

export async function sendHoldMail(booking: Booking) {
  const locale = booking.locale === "ar" ? "ar" : "fr";
  const due = when(deadline(new Date(booking.created_at)), locale);
  const slot = `${booking.date} · ${minutesLabel(booking.start_minutes)}`;
  const subject = locale === "ar" ? `${CENTRE} — أتمّوا الدفع خلال 48 ساعة` : `${CENTRE} — réglez sous 48 heures`;
  const html =
    locale === "ar"
      ? await shell(`<p>مرجعكم <strong>${booking.reference}</strong>.</p><p>${booking.service_name}<br>${slot}<br>${booking.price_mad} DH</p><p>للحفاظ على هذا الموعد، يُرجى الدفع قبل <strong>${due}</strong> (48 ساعة). بعد استلام الطلب يؤكّد المركز الموعد برسالة أخرى.</p>`)
      : await shell(`<p>Votre référence est <strong>${booking.reference}</strong>.</p><p>${booking.service_name}<br>${slot}<br>${booking.price_mad} DH</p><p>Pour garder cette place, réglez avant le <strong>${due}</strong> (48 heures). Quand le centre confirme le rendez-vous, vous recevez un second email.</p>`);
  return send(booking.customer_email, subject, html);
}

export async function sendConfirmedMail(booking: Booking) {
  const locale = booking.locale === "ar" ? "ar" : "fr";
  const slot = `${booking.date} · ${minutesLabel(booking.start_minutes)}`;
  const subject = locale === "ar" ? `${CENTRE} — الموعد مؤكَّد` : `${CENTRE} — rendez-vous confirmé`;
  const html =
    locale === "ar"
      ? await shell(`<p>تم تأكيد موعدكم <strong>${booking.reference}</strong>.</p><p>${booking.service_name}<br>${slot}<br>${booking.price_mad} DH</p>`)
      : await shell(`<p>Votre rendez-vous <strong>${booking.reference}</strong> est confirmé.</p><p>${booking.service_name}<br>${slot}<br>${booking.price_mad} DH</p>`);
  return send(booking.customer_email, subject, html);
}
