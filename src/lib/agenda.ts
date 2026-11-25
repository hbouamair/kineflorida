import { findService } from "@/content/catalog";
import { agenda } from "@/lib/slots";

export type Busy = { start_minutes: number; duration_minutes: number };

export function daySlots(
  date: string,
  duration: number,
  busy: Busy[],
  span?: { open: number; close: number } | null,
  now = new Date(),
) {
  if (span === null) return [];
  const open = span?.open ?? agenda.startHour * 60;
  const close = span?.close ?? agenda.endHour * 60;
  const slots: { startMinutes: number; label: string; free: boolean }[] = [];
  for (let start = open; start + duration <= close; start += agenda.stepMinutes) {
    const overlaps = busy.some(
      (block) => start < block.start_minutes + block.duration_minutes && start + duration > block.start_minutes,
    );
    if (overlaps) continue;
    const when = new Date(`${date}T${String(Math.floor(start / 60)).padStart(2, "0")}:${String(start % 60).padStart(2, "0")}:00+01:00`);
    const past = when.getTime() <= now.getTime();
    slots.push({ startMinutes: start, label: minutesLabel(start), free: !past });
  }
  return slots;
}

export function minutesLabel(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function newReference() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "KF-";
  for (let i = 0; i < 5; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

export function bookableService(id: string) {
  const service = findService(id);
  if (!service || service.minutes === null) return null;
  return service;
}
