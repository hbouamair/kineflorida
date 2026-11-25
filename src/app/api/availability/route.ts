import { NextRequest, NextResponse } from "next/server";
import { daySlots, type Busy } from "@/lib/agenda";
import { loadHours, spanForDate } from "@/lib/hours";
import { findOffering, loadOfferings } from "@/lib/offerings";
import { isDay } from "@/lib/slots";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? "";
  const serviceId = request.nextUrl.searchParams.get("service") ?? "";
  const { services } = await loadOfferings();
  const service = findOffering(services, serviceId);

  if (!isDay(date) || !service || service.minutes === null) {
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
    return NextResponse.json({ ok: true, slots, closed: span === null });
  } catch {
    return NextResponse.json({ ok: false, error: "unreachable" }, { status: 503 });
  }
}
