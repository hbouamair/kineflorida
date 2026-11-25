"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { bookAppointment, loadBlocks, type BookState } from "@/app/actions";
import { bookable, findService, formatMinutes, formatPrice } from "@/content/catalog";
import { copy } from "@/content/copy";
import type { Lang } from "@/lib/i18n";
import { buildSlots, type Block } from "@/lib/slots";

function Submit({ label, sending, disabled }: { label: string; sending: string; disabled: boolean }) {
  const status = useFormStatus();
  return (
    <button className="pill" type="submit" disabled={disabled || status.pending}>
      {status.pending ? sending : label}
    </button>
  );
}

export function BookingForm({ lang, initialService, configured }: { lang: Lang; initialService?: string; configured: boolean }) {
  const text = copy[lang];
  const [serviceId, setServiceId] = useState(initialService && findService(initialService)?.minutes ? initialService : bookable[0].id);
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loadError, setLoadError] = useState("");
  const [start, setStart] = useState("");
  const [state, setState] = useState<BookState>(null);
  const service = findService(serviceId);
  const slots = (service?.minutes ? buildSlots(day, service.minutes, blocks, lang === "ar" ? "ar-MA" : "fr-MA") : []).filter(
    (slot) => new Date(slot.iso).getTime() > Date.now(),
  );

  useEffect(() => {
    let cancelled = false;
    if (!configured) return;
    loadBlocks(day).then((result) => {
      if (!cancelled) {
        setBlocks(result.blocks);
        setLoadError("error" in result && result.error ? (lang === "ar" ? "تعذر الاتصال بجدول المواعيد." : "Le centre ne répond pas. Réessayez dans un moment.") : "");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [day, configured]);

  async function onSubmit(formData: FormData) {
    const result = await bookAppointment(state, formData);
    setState(result);
  }

  return (
    <form className="form" action={onSubmit}>
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="start" value={start} />
      <label>
        {text.care}
        <select className="field" name="service" value={serviceId} onChange={(event) => { setServiceId(event.target.value); setStart(""); }}>
          {bookable.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name[lang]} · {formatMinutes(item.minutes, lang)} · {formatPrice(item.price)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {text.day}
        <input className="field" type="date" name="day" value={day} min={new Date().toISOString().slice(0, 10)} onChange={(event) => { setDay(event.target.value); setStart(""); }} required />
      </label>
      <fieldset>
        <legend>{text.slots}</legend>
        <div className="slot-grid">
          {slots.map((slot) => (
            <button
              key={slot.iso}
              type="button"
              className="pill"
              aria-pressed={start === slot.iso}
              disabled={!slot.free || !configured || Boolean(loadError)}
              onClick={() => setStart(slot.iso)}
            >
              {slot.label}
              <span className="sr-only"> {slot.free ? text.free : text.taken}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <label>
        {text.name}
        <input className="field" name="name" autoComplete="name" required />
      </label>
      <label>
        {text.phone}
        <input className="field" name="phone" autoComplete="tel" inputMode="tel" required />
      </label>
      {!configured ? <p className="note">{text.agendaOff}</p> : null}
      {loadError ? <p role="alert">{loadError}</p> : null}
      {state?.ok === false ? <p role="alert">{state.message}</p> : null}
      {state?.ok === true ? <p role="status">{text.success}</p> : null}
      <Submit label={text.submit} sending={text.sending} disabled={!configured || !start || Boolean(loadError)} />
    </form>
  );
}
