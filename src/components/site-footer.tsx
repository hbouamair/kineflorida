import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, AtSign, Clock3, Mail, MapPin, Phone } from "lucide-react";
import { families } from "@/content/catalog";
import { copy } from "@/content/copy";
import { minutesLabel } from "@/lib/agenda";
import { instagramHref, instagramLabel, loadCentre, phoneHref } from "@/lib/centre";
import { loadHours, type DayHours } from "@/lib/hours";
import { homeOnly } from "@/lib/preview";
import type { Lang } from "@/lib/i18n";

const dayNames = {
  fr: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
  ar: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
};
const week = [1, 2, 3, 4, 5, 6, 0];

function hourLine(row: DayHours, lang: Lang) {
  if (!row.isOpen) return lang === "ar" ? "مغلق" : "Fermé";
  return `${minutesLabel(row.openMinutes)} – ${minutesLabel(row.closeMinutes)}`;
}

export async function SiteFooter({ lang }: { lang: Lang }) {
  await connection();
  const year = new Date().getFullYear();
  const text = copy[lang];
  const [{ centre }, hours] = await Promise.all([loadCentre(), loadHours()]);
  const rows = week.map((weekday) => hours.find((row) => row.weekday === weekday) ?? hours[0]);
  const first = hourLine(rows[0], lang);
  const uniform = rows.every((row) => hourLine(row, lang) === first);
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(centre.address)}`;

  return (
    <footer className="site-footer">
      <div className="shell foot-grid">
        <div className="foot-brand">
          <div className="foot-logo">
            <Image src="/logo.png" alt="" width={72} height={72} />
          </div>
          <p className="foot-name">{text.brand}</p>
          <p className="foot-lede">{text.lede}</p>
          {homeOnly ? (
            <a className="foot-cta" href="#reserver">
              {text.nav.book}
              <ArrowRight size={16} aria-hidden />
            </a>
          ) : (
            <Link className="foot-cta" href={`/${lang}/rendez-vous`}>
              {text.nav.book}
              <ArrowRight size={16} aria-hidden />
            </Link>
          )}
        </div>

        <div className="foot-col">
          <h2>{text.hoursLabel}</h2>
          {uniform ? (
            <p className="foot-uniform">
              <Clock3 size={16} aria-hidden />
              <span>
                <strong>{lang === "ar" ? "كل الأيام" : "Tous les jours"}</strong>
                <span dir="ltr">{first}</span>
              </span>
            </p>
          ) : (
            <ul className="foot-hours">
              {rows.map((row) => (
                <li key={row.weekday}>
                  <span>{dayNames[lang][row.weekday]}</span>
                  <b dir="ltr">{hourLine(row, lang)}</b>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="foot-col">
          <h2>{text.nav.cares}</h2>
          <ul className="foot-links">
            {families.map((family) => (
              <li key={family.id}>
                {homeOnly ? (
                  <span>{family.name[lang]}</span>
                ) : (
                  <Link href={`/${lang}/soins#${family.id}`}>{family.name[lang]}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="foot-col">
          <h2>{text.nav.contact}</h2>
          <ul className="foot-contact">
            <li>
              <Phone size={16} aria-hidden />
              <a href={phoneHref(centre.phone)} dir="ltr">{centre.phone}</a>
            </li>
            {centre.email ? (
              <li>
                <Mail size={16} aria-hidden />
                <a href={`mailto:${centre.email}`} dir="ltr">{centre.email}</a>
              </li>
            ) : null}
            <li>
              <AtSign size={16} aria-hidden />
              <a href={instagramHref(centre.instagram)} target="_blank" rel="noreferrer">
                {instagramLabel(centre.instagram)}
              </a>
            </li>
            <li>
              <MapPin size={16} aria-hidden />
              <a href={maps} target="_blank" rel="noreferrer">{centre.address}</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="foot-bar">
        <div className="shell">
          <p>© {year} {text.brand}</p>
          {homeOnly ? (
            <nav aria-label={text.brand}>
              <a href="#soins">{text.nav.cares}</a>
              <a href="#reserver">{text.nav.book}</a>
            </nav>
          ) : (
            <nav aria-label={text.brand}>
              <Link href={`/${lang}/soins`}>{text.nav.cares}</Link>
              <Link href={`/${lang}/packs`}>{text.nav.packs}</Link>
              <Link href={`/${lang}/contact`}>{text.nav.contact}</Link>
              <Link href={`/${lang}/rendez-vous`}>{text.nav.book}</Link>
            </nav>
          )}
        </div>
      </div>
    </footer>
  );
}
