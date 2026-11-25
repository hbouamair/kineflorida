import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatPrice } from "@/content/catalog";
import { copy } from "@/content/copy";
import { isLang, type Lang } from "@/lib/i18n";
import { loadOfferings } from "@/lib/offerings";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: copy[lang].packsTitle, description: copy[lang].packsLede };
}

export default async function PacksPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang = raw as Lang;
  const text = copy[lang];
  const { packs } = await loadOfferings();

  return (
    <main>
      <header className="page-hero">
        <div className="shell">
          <p className="script">By S.B</p>
          <h1>{text.packsTitle}</h1>
          <p className="lede">{text.packsLede}</p>
          <Link className="pc-btn is-solid" href={`/${lang}/soins`}>
            {text.nav.cares}
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </header>
      <section className="shell pack-layout">
        <figure className="shine">
          <Image src="/photos/move-2.jpg" alt={lang === "ar" ? "تمارين" : "Exercices"} width={900} height={1100} />
        </figure>
        <div className="pack-board">
          {packs.map((pack) => (
            <article key={pack.id}>
              <h2>{pack.name[lang]}</h2>
              <p>{pack.detail[lang]}</p>
              <div>
                {pack.prices.map((price) => (
                  <p key={price.amount}>
                    <small>{price.label[lang]}</small>
                    <strong>{formatPrice(price.amount)}</strong>
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
