import { connection } from "next/server";
import { RevenueDesk, type RevenueRow } from "@/components/admin/RevenueDesk";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const instant = false;

export default async function RevenuePage() {
  await connection();
  const now = new Date().toISOString();
  let paid: RevenueRow[] = [];
  let due = 0;

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("bookings")
      .select("id, date, price_mad, status, payment_status, customer_name, customer_email, service_name")
      .neq("status", "cancelled")
      .limit(5000);
    if (!error) {
      const rows = (data ?? []) as (RevenueRow & { status: string; payment_status: string })[];
      paid = rows.filter((row) => row.payment_status === "paid" && row.price_mad > 0);
      due = rows
        .filter((row) => row.payment_status !== "paid" && (row.status === "confirmed" || row.status === "completed"))
        .reduce((sum, row) => sum + row.price_mad, 0);
    }
  } catch {
    paid = [];
  }

  return <RevenueDesk now={now} paid={paid} due={due} />;
}
