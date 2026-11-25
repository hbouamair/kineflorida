import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type DayHours = {
  weekday: number;
  isOpen: boolean;
  openMinutes: number;
  closeMinutes: number;
};

const OPEN = 9 * 60;
const CLOSE = 18 * 60;

export function defaultHours(): DayHours[] {
  return Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    isOpen: true,
    openMinutes: OPEN,
    closeMinutes: CLOSE,
  }));
}

export function weekdayOf(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function spanForDate(date: string, rows: DayHours[]) {
  const row = rows.find((item) => item.weekday === weekdayOf(date));
  if (!row || !row.isOpen || row.closeMinutes <= row.openMinutes) return null;
  return { open: row.openMinutes, close: row.closeMinutes };
}

export async function loadHours(): Promise<DayHours[]> {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.from("opening_hours").select("weekday, is_open, open_minutes, close_minutes");
    if (error || !data?.length) return defaultHours();
    const seeded = defaultHours();
    for (const row of data) {
      const index = seeded.findIndex((item) => item.weekday === row.weekday);
      if (index < 0) continue;
      seeded[index] = {
        weekday: row.weekday,
        isOpen: Boolean(row.is_open),
        openMinutes: row.open_minutes,
        closeMinutes: row.close_minutes,
      };
    }
    return seeded;
  } catch {
    return defaultHours();
  }
}
