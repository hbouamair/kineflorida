"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowRight } from "lucide-react";
import { copy } from "@/content/copy";
import { homeOnly } from "@/lib/preview";
import type { Lang } from "@/lib/i18n";

gsap.registerPlugin(useGSAP);

export function HeroStage({ lang }: { lang: Lang }) {
  const root = useRef<HTMLElement>(null);
  const text = copy[lang];

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .fromTo(".pc-circle", { y: 22, scale: 0.94 }, { y: 0, scale: 1, duration: 0.9, clearProps: "transform" })
      .fromTo(".pc-mini", { y: 28, scale: 0.88, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.75, clearProps: "transform,opacity,visibility" }, 0.28)
      .fromTo(".pc-copy > *", { y: 16 }, { y: 0, duration: 0.5, stagger: 0.07, clearProps: "transform" }, 0.04);
  }, { scope: root });

  return (
    <section className="pc-hero" ref={root}>
      <div className="shell pc-hero-grid">
        <div className="pc-copy">
          <p className="pc-kicker">{text.brand}</p>
          <h1>{text.headline}</h1>
          <p className="lede">{text.lede}</p>
          <div className="pc-actions">
            {homeOnly ? (
              <>
                <a className="pc-btn is-solid" href="#soins">
                  {text.nav.cares}
                  <ArrowRight size={16} aria-hidden />
                </a>
                <a className="pc-btn" href="#reserver">
                  {text.nav.book}
                  <ArrowRight size={16} aria-hidden />
                </a>
              </>
            ) : (
              <>
                <Link className="pc-btn is-solid" href={`/${lang}/soins`}>
                  {text.nav.cares}
                  <ArrowRight size={16} aria-hidden />
                </Link>
                <Link className="pc-btn" href={`/${lang}/rendez-vous`}>
                  {text.nav.book}
                  <ArrowRight size={16} aria-hidden />
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="pc-portrait">
          <span className="pc-arc" aria-hidden />
          <div className="pc-circle shine">
            <Image src="/photos/pain-3.jpg" alt={lang === "ar" ? "ألم الظهر" : "Douleur du dos"} fill priority sizes="460px" />
          </div>
          <figure className="pc-mini shine">
            <Image
              src="/photos/kine.jpg"
              alt={lang === "ar" ? "جلسة علاج طبيعي" : "Séance de kinésithérapie"}
              fill
              sizes="200px"
            />
          </figure>
        </div>
      </div>
    </section>
  );
}
