"use client";

import { bookable, families, formatMinutes, formatPrice, type FamilyId, type Service } from "@/content/catalog";
import { daySlots } from "@/lib/agenda";
import type { Lang } from "@/lib/i18n";
import { addMonths, eachDayOfInterval, endOfMonth, format, isBefore, parseISO, startOfDay, startOfMonth } from "date-fns";
import { ar, fr } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";

type Slot = { startMinutes: number; label: string; free: boolean };
type Step = "care" | "day" | "time" | "who" | "done";

const words = {
  fr: {
    steps: ["Soin", "Créneau", "Vous", "Confirmé"],
    careHint: "Un créneau s'ouvre seulement pour un soin dont la durée est imprimée.",
    back: "Retour",
    next: "Continuer",
    empty: "Aucun créneau libre ce jour.",
    taken: "Pris",
    name: "Nom",
    email: "Email",
    phone: "Téléphone",
    hold: "La demande reste en attente. Le règlement, sous 48 heures, garde la place.",
    send: "Demander ce créneau",
    sending: "Envoi…",
    pending: "En attente de confirmation",
    done: "La place est retenue 48 heures. Le règlement la garde, puis le centre confirme.",
    ref: "Référence",
    another: "Autre rendez-vous",
    morning: "Matin",
    afternoon: "Après-midi",
    day: "Jour",
    errors: {
      invalid: "Vérifiez le nom, l'email et le téléphone.",
      taken: "Ce créneau vient d'être pris.",
      schema: "L'agenda n'est pas encore créé. Exécutez supabase/schema.sql dans Supabase.",
      rights: "L'enregistrement n'est pas encore ouvert. Le centre doit activer l'agenda.",
      unreachable: "Le centre ne répond pas. Réessayez dans un moment.",
    },
  },
  ar: {
    steps: ["العلاج", "الموعد", "بياناتكم", "تأكيد"],
    careHint: "لا يُفتح موعد إلا لعلاج مدته مطبوعة في الكتيب.",
    back: "رجوع",
    next: "متابعة",
    empty: "لا يوجد موعد متاح في هذا اليوم.",
    taken: "محجوز",
    name: "الاسم",
    email: "البريد",
    phone: "الهاتف",
    hold: "يبقى الطلب معلّقاً. السداد خلال 48 ساعة يُبقي الموعد.",
    send: "طلب هذا الموعد",
    sending: "جارٍ الإرسال…",
    pending: "في انتظار التأكيد",
    done: "الموعد محجوز لـ 48 ساعة. السداد يبقيه، ثم يؤكده المركز.",
    ref: "المرجع",
    another: "موعد آخر",
    morning: "صباحاً",
    afternoon: "بعد الظهر",
    day: "اليوم",
    errors: {
      invalid: "تحققوا من الاسم والبريد والهاتف.",
      taken: "هذا الموعد أُخذ للتو.",
      schema: "جدول المواعيد غير مُنشأ بعد. نفّذوا supabase/schema.sql في Supabase.",
      rights: "التسجيل غير مفتوح بعد. يجب على المركز تفعيل جدول المواعيد.",
      unreachable: "المركز لا يجيب. أعيدوا المحاولة بعد قليل.",
    },
  },
} as const;

export function CareWizard({ lang, initialService, cares }: { lang: Lang; initialService?: string; cares?: Service[] }) {
  const text = words[lang];
  const locale = lang === "ar" ? ar : fr;
  const list = cares?.length ? cares : bookable;
  const initial = list.find((service) => service.id === initialService) ?? null;
  const [step, setStep] = useState<Step>(initial ? "day" : "care");
  const [familyId, setFamilyId] = useState<FamilyId>(initial?.family ?? "kine");
  const [serviceId, setServiceId] = useState(initial?.id ?? "");
  const [cursor, setCursor] = useState<Date | null>(null);
  const [day, setDay] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotState, setSlotState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [slotError, setSlotError] = useState<keyof typeof text.errors | "">("");
  const [startMinutes, setStartMinutes] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<keyof typeof text.errors | "">("");
  const [reference, setReference] = useState("");
  const [ready, setReady] = useState(false);

  const service = list.find((item) => item.id === serviceId) ?? null;
  const today = ready ? startOfDay(new Date()) : null;

  useEffect(() => {
    setReady(true);
    setCursor(startOfMonth(new Date()));
  }, []);

  useEffect(() => {
    if (!service || service.minutes === null || !day) return;
    const controller = new AbortController();
    const seeded = daySlots(day, service.minutes, []);
    setSlots(seeded);
    setSlotState("ready");
    setSlotError("");
    fetch(`/api/availability?service=${service.id}&date=${day}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as { ok: boolean; slots?: Slot[]; error?: keyof typeof text.errors };
        if (!response.ok || !payload.ok || !payload.slots) {
          setSlots([]);
          setSlotState("error");
          setSlotError(payload.error && payload.error in text.errors ? payload.error : "unreachable");
          return;
        }
        setSlots(payload.slots);
        setSlotState("ready");
        setSlotError("");
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setSlots([]);
        setSlotState("error");
        setSlotError("unreachable");
      });
    return () => controller.abort();
  }, [service, day, text.errors]);

  const days = useMemo(() => {
    if (!cursor) return null;
    const start = startOfMonth(cursor);
    const list = eachDayOfInterval({ start, end: endOfMonth(cursor) });
    const pad = (start.getDay() + 6) % 7;
    return { pad, list };
  }, [cursor]);

  const chosen = slots.find((slot) => slot.startMinutes === startMinutes) ?? null;

  function pickCare(id: string) {
    setServiceId(id);
    setDay("");
    setStartMinutes(null);
    setStep("day");
  }

  function pickDay(value: string) {
    setDay(value);
    setStartMinutes(null);
    setSlots([]);
    setSlotError("");
    setSlotState("loading");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!service || startMinutes === null) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          date: day,
          startMinutes,
          name,
          email,
          phone,
          locale: lang,
        }),
      });
      const payload = (await response.json()) as { ok: boolean; reference?: string; error?: keyof typeof text.errors };
      if (!response.ok || !payload.ok || !payload.reference) {
        setError(payload.error && payload.error in text.errors ? payload.error : "unreachable");
        return;
      }
      setReference(payload.reference);
      setStep("done");
    } catch {
      setError("unreachable");
    } finally {
      setSending(false);
    }
  }

  const visualIndex = step === "done" ? 3 : step === "who" ? 2 : step === "care" ? 0 : 1;
  const visible = list.filter((item) => item.family === familyId);
  const morning = slots.filter((slot) => slot.startMinutes < 12 * 60);
  const afternoon = slots.filter((slot) => slot.startMinutes >= 12 * 60);
  const todayKey = today ? format(today, "yyyy-MM-dd") : "";

  function renderSlots(group: Slot[]) {
    return (
      <div className="book-chips">
        {group.map((slot) => (
          <button
            key={slot.startMinutes}
            type="button"
            className={startMinutes === slot.startMinutes ? "book-chip-active" : "book-chip-idle"}
            disabled={!slot.free}
            aria-pressed={startMinutes === slot.startMinutes}
            onClick={() => setStartMinutes(slot.startMinutes)}
          >
            {slot.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="book-frame">
      <div className="book-frame-inner">
        <ol className="book-step-track">
          {text.steps.map((label, index) => (
            <li className="book-step-item" key={label}>
              <span
                className={
                  index === visualIndex
                    ? "book-step-dot book-step-dot--active"
                    : index < visualIndex
                      ? "book-step-dot book-step-dot--done"
                      : "book-step-dot"
                }
              >
                {index + 1}
              </span>
              <span className={index === visualIndex ? "book-step-label" : "book-step-label book-step-label--muted"}>
                {label}
              </span>
            </li>
          ))}
        </ol>
        <div className="book-progress-track" aria-hidden="true">
          <div className="book-progress-fill" style={{ width: `${(visualIndex / 3) * 100}%` }} />
        </div>

        {step === "care" ? (
          <div>
            <header className="book-step-header">
              <div>
                <h2 className="book-step-title">{text.steps[0]}</h2>
                <p className="book-step-desc">{text.careHint}</p>
              </div>
            </header>
            <div className="book-chips" role="tablist">
              {families.map((family) => (
                <button
                  key={family.id}
                  type="button"
                  className={familyId === family.id ? "book-chip-active" : "book-chip-idle"}
                  aria-pressed={familyId === family.id}
                  onClick={() => setFamilyId(family.id)}
                >
                  {family.name[lang]}
                </button>
              ))}
            </div>
            <div className="book-options">
              {visible.map((item) => (
                <button className="book-option-card" key={item.id} type="button" onClick={() => pickCare(item.id)}>
                  <strong>{item.name[lang]}</strong>
                  <span>{formatMinutes(item.minutes, lang)}</span>
                  <em>{formatPrice(item.price)}</em>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {(step === "day" || step === "time") && service ? (
          <div>
            <header className="book-step-header">
              <div>
                <h2 className="book-step-title">{text.steps[1]}</h2>
              </div>
              <button className="book-btn-ghost" type="button" onClick={() => setStep("care")}>{text.back}</button>
            </header>
            <div className="book-badges">
              <span className="book-badge">{service.name[lang]}</span>
              <span className="book-badge">{formatMinutes(service.minutes, lang)}</span>
              <span className="book-badge">{formatPrice(service.price)}</span>
            </div>
            <div className="book-split">
              <div className="book-card">
                <h3 className="book-section-head">{text.day}</h3>
                {cursor && days ? (
                  <>
                    <div className="book-cal-bar">
                      <button className="book-cal-nav" type="button" onClick={() => setCursor(addMonths(cursor, -1))} aria-label={text.back}>←</button>
                      <strong>{format(cursor, "LLLL yyyy", { locale })}</strong>
                      <button className="book-cal-nav" type="button" onClick={() => setCursor(addMonths(cursor, 1))} aria-label={text.next}>→</button>
                    </div>
                    <div className="book-cal">
                      {Array.from({ length: 7 }, (_, index) => (
                        <span key={`dow-${index}`} className="book-cal-dow">
                          {format(new Date(2026, 0, 5 + index), "EEEEEE", { locale })}
                        </span>
                      ))}
                      {Array.from({ length: days.pad }, (_, index) => (
                        <span key={`pad-${index}`} />
                      ))}
                      {days.list.map((date) => {
                        const value = format(date, "yyyy-MM-dd");
                        const past = today ? isBefore(date, today) : false;
                        const tone = past
                          ? "book-cal-day book-cal-day--disabled"
                          : day === value
                            ? "book-cal-day book-cal-day--selected"
                            : value === todayKey
                              ? "book-cal-day book-cal-day--today"
                              : "book-cal-day book-cal-day--idle";
                        return (
                          <button key={value} type="button" className={tone} disabled={past || !ready} aria-pressed={day === value} onClick={() => pickDay(value)}>
                            {format(date, "d")}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : null}
              </div>
              <div className="book-card">
                <h3 className="book-section-head">{text.steps[1]}</h3>
                {!day ? <p>{text.day}</p> : null}
                {slotState === "loading" ? <p>{text.steps[1]}…</p> : null}
                {slotError ? <p className="note" role="alert">{text.errors[slotError]}</p> : null}
                {slotState === "ready" && slots.length > 0 && slots.every((slot) => !slot.free) ? <p>{text.empty}</p> : null}
                {slotState === "ready" ? (
                  <div className="book-slot-groups">
                    {morning.length > 0 ? <section><h4>{text.morning}</h4>{renderSlots(morning)}</section> : null}
                    {afternoon.length > 0 ? <section><h4>{text.afternoon}</h4>{renderSlots(afternoon)}</section> : null}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="book-nav">
              <button className="book-btn-ghost" type="button" onClick={() => setStep("care")}>{text.back}</button>
              <button className="book-btn-primary" type="button" disabled={!chosen} onClick={() => setStep("who")}>{text.next}</button>
            </div>
          </div>
        ) : null}

        {step === "who" && service && chosen ? (
          <form className="book-form" onSubmit={submit}>
            <header className="book-step-header">
              <div>
                <h2 className="book-step-title">{text.steps[2]}</h2>
                <p className="book-step-desc">
                  {service.name[lang]} · {format(parseISO(day), "EEEE d MMMM", { locale })} · {chosen.label}
                </p>
              </div>
            </header>
            <div className="book-price-hero">
              <strong>{formatPrice(service.price)}</strong>
              <span>{text.hold}</span>
            </div>
            <label>
              {text.name}
              <input className="book-input" name="name" autoComplete="name" required minLength={2} value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              {text.email}
              <input className="book-input" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              {text.phone}
              <input className="book-input" name="phone" type="tel" autoComplete="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} />
            </label>
            {error ? <p className="note" role="alert">{text.errors[error]}</p> : null}
            <div className="book-nav">
              <button className="book-btn-ghost" type="button" onClick={() => setStep("day")}>{text.back}</button>
              <button className="book-btn-primary" type="submit" disabled={sending}>{sending ? text.sending : text.send}</button>
            </div>
          </form>
        ) : null}

        {step === "done" ? (
          <div className="book-done">
            <p className="script">{text.pending}</p>
            <p className="book-ref-label">{text.ref}</p>
            <p className="book-reference">{reference}</p>
            <p>{text.done}</p>
            <button
              className="book-btn-primary"
              type="button"
              onClick={() => {
                setStep("care");
                setReference("");
                setDay("");
                setStartMinutes(null);
              }}
            >
              {text.another}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
