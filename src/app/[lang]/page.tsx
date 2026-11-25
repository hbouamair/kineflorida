import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { families, type FamilyId } from "@/content/catalog";
import { familyPhoto } from "@/content/photos";
import { HeroStage } from "@/components/hero-stage";
import { HomeMotion } from "@/components/home-motion";
import { copy } from "@/content/copy";
import { homeOnly } from "@/lib/preview";
import { isLang, type Lang } from "@/lib/i18n";
import { notFound } from "next/navigation";

export const instant = false;

const rail = [
  "/photos/color.jpg",
  "/photos/exercice.jpg",
  "/photos/aquabike.jpg",
  "/photos/kine.jpg",
  "/photos/glace.jpg",
  "/photos/sport-2.jpg",
];

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang = raw as Lang;
  const text = copy[lang];
  const [familiesLead, ...familiesRest] = text.familiesTitle.split(/,\s*/);
  const familiesAccent = familiesRest.join(", ");

  return (
    <HomeMotion>
    <main>
      <HeroStage lang={lang} />
      <div className="pc-rail" aria-hidden>
        <div className="pc-rail-track">
          {[...rail, ...rail].map((src, index) => (
            <Image key={`${src}-${index}`} src={src} alt="" width={420} height={520} />
          ))}
        </div>
      </div>
      <section className="pc-services" id="soins">
        <div className="shell">
          <div className="pc-head rise-in">
            <div>
              <p className="pc-kicker">{text.nav.cares}</p>
              <h2 className="pc-families-title">
                {familiesAccent ? (
                  <>
                    <span>{familiesLead},</span>
                    <span className="pc-families-accent">{familiesAccent}</span>
                  </>
                ) : (
                  text.familiesTitle
                )}
              </h2>
              <p className="lede">{text.familiesLede}</p>
            </div>
            {homeOnly ? null : (
              <Link className="pc-btn is-solid" href={`/${lang}/soins`}>
                {text.soinsTitle}
                <ArrowRight size={16} aria-hidden />
              </Link>
            )}
          </div>
          <div className="pc-cards">
            {families.map((family, index) => {
              const photo = familyPhoto[family.id as FamilyId];
              const line = text.familyLines[family.id as FamilyId];
              const cardInner = (
                <figure className={photo ? undefined : "is-plain"}>
                  {photo ? (
                    <Image
                      src={photo.src}
                      alt={photo.alt[lang]}
                      width={900}
                      height={1200}
                      sizes="(max-width: 859px) 90vw, 30vw"
                      style={{ width: "100%", height: "auto" }}
                    />
                  ) : (
                    <span className="script" aria-hidden="true">Florida</span>
                  )}
                  <div className="pc-card-veil">
                    <em aria-hidden="true">{String(index + 1).padStart(2, "0")}</em>
                    <h3>{family.name[lang]}</h3>
                    <p>{line}</p>
                    {!homeOnly ? (
                      <span className="pc-card-go" aria-hidden>
                        <ArrowRight size={16} />
                      </span>
                    ) : null}
                  </div>
                </figure>
              );
              return (
                <article className="rise-in" key={family.id}>
                  {homeOnly ? (
                    <div className="pc-card">{cardInner}</div>
                  ) : (
                    <Link className="pc-card" href={`/${lang}/soins#${family.id}`}>
                      {cardInner}
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section className="pc-plan" id="reserver">
        <div className="pc-plan-stage">
          <Image
            className="pc-plan-bg"
            src="/photos/aqua.jpg"
            alt={lang === "ar" ? "دراجة مائية" : "Aquabike"}
            fill
            sizes="100vw"
            priority={false}
          />
          <div className="pc-plan-scrim" aria-hidden />
          <span className="pc-plan-orbit" aria-hidden />
          <div className="shell pc-plan-inner">
            <div className="pc-plan-copy rise-in">
              <p className="pc-kicker">{text.nav.book}</p>
              <h2>
                <span>{text.bookTitle.split(" ").slice(0, -1).join(" ") || text.bookTitle}</span>
                {text.bookTitle.includes(" ") ? (
                  <span className="pc-plan-accent">{text.bookTitle.split(" ").slice(-1)[0]}</span>
                ) : null}
              </h2>
              <p className="lede">{text.bookLede}</p>
              <ol className="pc-plan-flow" aria-label={text.stepsTitle}>
                {text.steps.map((step, index) => (
                  <li key={step.title}>
                    <em aria-hidden="true">{String(index + 1).padStart(2, "0")}</em>
                    <span>
                      <strong>{step.title}</strong>
                      <small>{step.body}</small>
                    </span>
                  </li>
                ))}
              </ol>
              {homeOnly ? (
                <span className="pc-btn is-lime is-static">
                  {text.nav.book}
                  <ArrowRight size={16} aria-hidden />
                </span>
              ) : (
                <Link className="pc-btn is-lime" href={`/${lang}/rendez-vous`}>
                  {text.nav.book}
                  <ArrowRight size={16} aria-hidden />
                </Link>
              )}
            </div>
            <p className="pc-plan-script rise-in" aria-hidden>
              Florida
            </p>
          </div>
        </div>
      </section>
    </main>
    </HomeMotion>
  );
}
