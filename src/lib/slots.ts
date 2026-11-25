export const agenda = {
  status: "placeholder" as const,
  startHour: 9,
  endHour: 18,
  stepMinutes: 30,
  timeZone: "Africa/Casablanca",
  offset: "+01:00",
};

export type Block = { starts_at: string; ends_at: string };

export type Slot = { iso: string; label: string; free: boolean };

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function zoned(day: string, hour: number, minute: number) {
  return new Date(`${day}T${pad(hour)}:${pad(minute)}:00${agenda.offset}`);
}

export function isDay(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function buildSlots(day: string, minutes: number, blocks: Block[], locale: string, now = new Date()): Slot[] {
  const close = zoned(day, agenda.endHour, 0);
  const slots: Slot[] = [];
  for (let hour = agenda.startHour; hour < agenda.endHour; hour += 1) {
    for (let minute = 0; minute < 60; minute += agenda.stepMinutes) {
      const start = zoned(day, hour, minute);
      const end = new Date(start.getTime() + minutes * 60_000);
      if (end > close) continue;
      const overlaps = blocks.some((block) => start < new Date(block.ends_at) && end > new Date(block.starts_at));
      const past = start.getTime() <= now.getTime();
      slots.push({
        iso: start.toISOString(),
        label: new Intl.DateTimeFormat(locale, {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: agenda.timeZone,
        }).format(start),
        free: !overlaps && !past,
      });
    }
  }
  return slots;
}
