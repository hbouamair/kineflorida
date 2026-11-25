import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { minutesLabel } from "@/lib/agenda";
import { paymentLabel, statusLabel, type Booking } from "@/lib/booking";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const view = request.nextUrl.searchParams.get("view") ?? "active";
  const admin = getSupabaseAdmin();
  let query = admin.from("bookings").select("*").order("date", { ascending: false }).order("start_minutes", { ascending: false });
  if (view === "archive") query = query.eq("status", "cancelled");
  else if (view === "passed") query = query.eq("status", "completed");
  else query = query.in("status", ["pending", "confirmed"]);

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false }, { status: 503 });

  const rows = (data ?? []) as Booking[];
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Réservations");
  sheet.addRow(["Référence", "Patient", "Téléphone", "Email", "Soin", "Date", "Heure", "Durée (min)", "Prix (DH)", "Statut", "Paiement"]);
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) {
    sheet.addRow([
      row.reference,
      row.customer_name,
      row.customer_phone,
      row.customer_email,
      row.service_name,
      row.date,
      minutesLabel(row.start_minutes),
      row.duration_minutes,
      row.price_mad,
      statusLabel[row.status],
      paymentLabel[row.payment_status],
    ]);
  }
  sheet.columns.forEach((column) => {
    column.width = 22;
  });

  const file = await workbook.xlsx.writeBuffer();
  const name = view === "archive" ? "archives" : view === "passed" ? "passees" : "actives";
  return new NextResponse(file, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="reservations-${name}.xlsx"`,
    },
  });
}
