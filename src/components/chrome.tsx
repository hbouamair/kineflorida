"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarCheck, Home, MapPin, Menu, Package, Stethoscope, X } from "lucide-react";
import { copy } from "@/content/copy";
import { homeOnly } from "@/lib/preview";
import { otherLang, type Lang } from "@/lib/i18n";

function current(path: string, href: string, exact = false) {
  if (exact) return path === href ? "page" : undefined;
  return path === href || path.startsWith(`${href}/`) ? "page" : undefined;
}

export function Header({ lang }: { lang: Lang }) {
  const text = copy[lang];
  const path = usePathname() || `/${lang}`;
  const rest = homeOnly ? "" : path.replace(/^\/(fr|ar)/, "") || "";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const item = (href: string, label: string) => (
    <Link href={href} aria-current={path === href ? "page" : undefined}>
      {label}
    </Link>
  );
  const sheets = homeOnly
    ? ([[`/${lang}`, text.nav.home, true]] as const)
    : ([
        [`/${lang}`, text.nav.home, true],
        [`/${lang}/soins`, text.nav.cares, false],
        [`/${lang}/packs`, text.nav.packs, false],
        [`/${lang}/contact`, text.nav.contact, false],
        [`/${lang}/rendez-vous`, text.nav.book, false],
      ] as const);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className={scrolled ? "site-header is-scrolled" : "site-header"}>
        <div className="shell">
          <Link href={`/${lang}`} className="brand" aria-label={text.brand}>
            <Image src="/logo.png" alt="" width={64} height={64} priority />
          </Link>
          {!homeOnly ? (
            <nav className="nav" aria-label={text.brand}>
              {item(`/${lang}/soins`, text.nav.cares)}
              {item(`/${lang}/packs`, text.nav.packs)}
              {item(`/${lang}/contact`, text.nav.contact)}
              <Link className="pill" href={`/${lang}/rendez-vous`}>
                {text.nav.book}
              </Link>
            </nav>
          ) : (
            <nav className="nav is-preview" aria-label={text.brand}>
              <a href="#soins">{text.nav.cares}</a>
              <a className="pill" href="#reserver">
                {text.nav.book}
              </a>
            </nav>
          )}
          <Link
            className="lang-switch"
            data-lang={lang}
            dir="ltr"
            href={`/${otherLang(lang)}${rest}`}
            hrefLang={otherLang(lang)}
            aria-label={text.langLabel}
          >
            <span className={lang === "fr" ? "is-on" : ""} lang="fr">Fr</span>
            <span className={lang === "ar" ? "is-on" : ""} lang="ar">ع</span>
          </Link>
          {!homeOnly ? (
            <button
              className="menu-toggle"
              type="button"
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
              <span className="sr-only">{open ? text.nav.close : text.nav.menu}</span>
            </button>
          ) : null}
        </div>
      </header>
      {!homeOnly ? (
        <div className={open ? "site-menu is-open" : "site-menu"} id="site-menu" hidden={!open}>
          <nav aria-label={text.nav.menu}>
            {sheets.map(([href, label, exact]) => (
              <Link key={href} href={href} aria-current={current(path, href, exact)} onClick={() => setOpen(false)}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </>
  );
}

export function MobileBar({ lang }: { lang: Lang }) {
  const text = copy[lang];
  const path = usePathname() || `/${lang}`;

  if (homeOnly) {
    return (
      <nav className="mobile-bar is-preview" aria-label={text.brand}>
        <a href="#contenu">
          <Home size={18} aria-hidden />
          <span>{text.nav.home}</span>
        </a>
        <a href="#soins">
          <Stethoscope size={18} aria-hidden />
          <span>{text.nav.cares}</span>
        </a>
        <a href="#reserver" className="is-book">
          <CalendarCheck size={22} aria-hidden />
          <span>{text.nav.book}</span>
        </a>
      </nav>
    );
  }

  const tabs = [
    { href: `/${lang}`, label: text.nav.home, icon: Home, exact: true },
    { href: `/${lang}/soins`, label: text.nav.cares, icon: Stethoscope, exact: false },
    { href: `/${lang}/rendez-vous`, label: text.nav.book, icon: CalendarCheck, exact: false, accent: true },
    { href: `/${lang}/packs`, label: text.nav.packs, icon: Package, exact: false },
    { href: `/${lang}/contact`, label: text.nav.contact, icon: MapPin, exact: false },
  ];

  return (
    <nav className="mobile-bar" aria-label={text.brand}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link key={tab.href} href={tab.href} aria-current={current(path, tab.href, tab.exact)} className={tab.accent ? "is-book" : undefined}>
            <Icon size={tab.accent ? 22 : 18} aria-hidden />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
