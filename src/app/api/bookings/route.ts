import { NextRequest, NextResponse } from "next/server";
import { daySlots, newReference, type Busy } from "@/lib/agenda";
import { loadHours, spanForDate } from "@/lib/hours";
import { payBy, sendHoldMail } from "@/lib/mail";
import { findOffering, loadOfferings } from "@/lib/offerings";
import { isDay } from "@/lib/slots";
import type { Booking } from "@/lib/booking";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type Payload = {
  serviceId?: unknown;
  date?: unknown;
  startMinutes?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  locale?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const { services } = await loadOfferings();
  const service = findOffering(services, text(body.serviceId));
  const date = text(body.date);
  const startMinutes = Number(body.startMinutes);
  const name = text(body.name);
  const email = text(body.email).toLowerCase();
  const phone = text(body.phone);
  const locale = body.locale === "ar" ? "ar" : "fr";

  if (!service || service.minutes === null || !isDay(date)) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || phone.replace(/\D/g, "").length < 8) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  try {
    const admin = getSupabaseAdmin();
    const [busyResult, hours] = await Promise.all([
      admin.rpc("get_busy_slots", { p_date: date }),
      loadHours(),
    ]);
    const busy = busyResult.error ? [] : ((busyResult.data ?? []) as Busy[]);
    const span = spanForDate(date, hours);
    const slots = daySlots(date, service.minutes, busy, span);
    const chosen = slots.find((slot) => slot.startMinutes === startMinutes && slot.free);
    if (!chosen) {
      return NextResponse.json({ ok: false, error: "taken" }, { status: 409 });
    }

    const due = payBy();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const reference = newReference();
      const row = {
        reference,
        service_id: service.id,
        service_name: service.name.fr,
        date,
        start_minutes: startMinutes,
        duration_minutes: service.minutes,
        price_mad: service.price,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        locale,
        status: "pending",
        payment_status: "unpaid",
        pay_by: due,
      };
      let inserted = await admin.from("bookings").insert(row).select("*").single();
      if (inserted.error && /pay_by/i.test(inserted.error.message)) {
        const { pay_by: _ignored, ...withoutDue } = row;
        inserted = await admin.from("bookings").insert(withoutDue).select("*").single();
      }

      if (!inserted.error && inserted.data) {
        const booking = inserted.data as Booking;
        await sendHoldMail({ ...booking, created_at: booking.created_at || new Date().toISOString() });
        return NextResponse.json({ ok: true, reference: booking.reference, status: "pending" });
      }

      const message = inserted.error?.message ?? "";
      const code = inserted.error?.code;
      if (code === "23P01") return NextResponse.json({ ok: false, error: "taken" }, { status: 409 });
      if (code === "23505") continue;
      if (code === "42501" || /permission denied/i.test(message)) {
        return NextResponse.json({ ok: false, error: "rights" }, { status: 503 });
      }
      const schema = /relation|does not exist|schema cache/i.test(message);
      return NextResponse.json({ ok: false, error: schema ? "schema" : "unreachable" }, { status: 503 });
    }

    return NextResponse.json({ ok: false, error: "unreachable" }, { status: 503 });
  } catch {
    return NextResponse.json({ ok: false, error: "unreachable" }, { status: 503 });
  }
}
