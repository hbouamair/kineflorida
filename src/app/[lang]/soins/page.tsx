import Image from "next/image";
import { families, formatMinutes, formatPrice, type FamilyId } from "@/content/catalog";
import { familyPhoto } from "@/content/photos";
import { HomeMotion } from "@/components/home-motion";
import { copy } from "@/content/copy";
import { isLang, type Lang } from "@/lib/i18n";
import { loadOfferings } from "@/lib/offerings";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: copy[lang].soinsTitle, description: copy[lang].soinsLede };
}

export default async function SoinsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang = raw as Lang;
  const text = copy[lang];
  const { services } = await loadOfferings();

  return (
    <HomeMotion>
      <main>
        <header className="page-hero">
          <div className="shell rise-in">
            <p className="script">By S.B</p>
            <h1>{text.soinsTitle}</h1>
            <p className="lede">{text.soinsLede}</p>
          </div>
        </header>
        <nav className="shell page-jumps rise-in" aria-label={text.soinsTitle}>
          {families.map((family) => (
            <a key={family.id} href={`#${family.id}`}>{family.name[lang]}</a>
          ))}
        </nav>
        {families.map((family) => {
          const photo = familyPhoto[family.id];
          const cares = services.filter((service) => service.family === family.id);
          const line = text.familyLines[family.id as FamilyId];
          return (
            <section className="shell care-band" id={family.id} key={family.id}>
              <figure className={`rise-in ${photo ? "shine" : "is-plain"}`}>
                {photo ? (
                  <Image src={photo.src} alt={photo.alt[lang]} width={720} height={900} />
                ) : (
                  <span className="script">By S.B</span>
                )}
              </figure>
              <div className="rise-in">
                <h2>{family.name[lang]}</h2>
                <p className="lede">{line}</p>
                <ul>
                  {cares.map((service) => (
                    <li className="rise-in" key={service.id}>
                      <div>
                        <h3>{service.name[lang]}</h3>
                        <p>
                          {formatMinutes(service.minutes, lang)}
                          {service.minutes === null ? (
                            <span className="care-quiet"> · {lang === "ar" ? "بدون حجز ساعة" : "Sans créneau"}</span>
                          ) : null}
                        </p>
                      </div>
                      <strong>{formatPrice(service.price)}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          );
        })}
      </main>
    </HomeMotion>
  );
}
