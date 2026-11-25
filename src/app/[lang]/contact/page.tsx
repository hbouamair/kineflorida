import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { copy } from "@/content/copy";
import { minutesLabel } from "@/lib/agenda";
import { instagramHref, instagramLabel, loadCentre, phoneHref } from "@/lib/centre";
import { loadHours } from "@/lib/hours";
import { isLang, type Lang } from "@/lib/i18n";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const instant = false;

const dayNames = {
  fr: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
  ar: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
};
const week = [1, 2, 3, 4, 5, 6, 0];

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: copy[lang].contactTitle, description: copy[lang].contactLede };
}

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang = raw as Lang;
  const text = copy[lang];
  const [{ centre }, hours] = await Promise.all([loadCentre(), loadHours()]);
  const mapsQuery = encodeURIComponent(centre.address);
  const closed = lang === "ar" ? "مغلق" : "Fermé";
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const rows = week.map((weekday) => hours.find((item) => item.weekday === weekday) ?? hours[0]);
  const lineFor = (weekday: number) => {
    const row = rows.find((item) => item.weekday === weekday);
    if (!row?.isOpen) return closed;
    return `${minutesLabel(row.openMinutes)} – ${minutesLabel(row.closeMinutes)}`;
  };
  const first = lineFor(rows[0].weekday);
  const uniform = rows.every((row) => lineFor(row.weekday) === first);

  return (
    <main>
      <header className="page-hero">
        <div className="shell">
          <p className="script">By S.B</p>
          <h1>{text.contactTitle}</h1>
          <p className="lede">{text.contactLede}</p>
          <Link className="pc-btn is-solid" href={`/${lang}/rendez-vous`}>
            {text.nav.book}
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </header>
      <section className="shell visit">
        <ul>
          <li>
            <a href={mapsHref} target="_blank" rel="noreferrer">
              <small>{text.addressLabel}</small>
              <strong>{centre.address}</strong>
            </a>
          </li>
          <li>
            <a href={phoneHref(centre.phone)}>
              <small>{text.phone}</small>
              <strong dir="ltr">{centre.phone}</strong>
            </a>
          </li>
          <li>
            <a href={instagramHref(centre.instagram)} target="_blank" rel="noreferrer">
              <small>{text.instagram}</small>
              <strong dir="ltr">{instagramLabel(centre.instagram)}</strong>
            </a>
          </li>
          {centre.email ? (
            <li>
              <a href={`mailto:${centre.email}`}>
                <small>Email</small>
                <strong dir="ltr">{centre.email}</strong>
              </a>
            </li>
          ) : null}
          <li>
            <span>
              <small>{text.hoursLabel}</small>
              {uniform ? (
                <strong dir="ltr">{lang === "ar" ? "كل الأيام" : "Tous les jours"} · {first}</strong>
              ) : (
                <strong>
                  {rows.map((row) => (
                    <em key={row.weekday}>{dayNames[lang][row.weekday]} · <b dir="ltr">{lineFor(row.weekday)}</b></em>
                  ))}
                </strong>
              )}
            </span>
          </li>
        </ul>
        <figure>
          <iframe
            title={centre.address}
            src={`https://maps.google.com/maps?q=${mapsQuery}&z=16&hl=${lang}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <a href={mapsHref} target="_blank" rel="noreferrer">{text.mapLabel}</a>
        </figure>
      </section>
    </main>
  );
}
