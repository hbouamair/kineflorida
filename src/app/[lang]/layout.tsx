import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header, MobileBar } from "@/components/chrome";
import { SiteFooter } from "@/components/site-footer";
import { copy } from "@/content/copy";
import { instagramHref, loadCentre, phoneHref } from "@/lib/centre";
import { isLang, langs, type Lang } from "@/lib/i18n";

export const instant = false;

export function generateStaticParams() {
  return langs.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { description: copy[lang].metaDescription };
}

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const text = copy[lang];
  const { centre } = await loadCentre();
  return (
    <div className="site" lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <a className="skip" href="#contenu">{text.skip}</a>
      <Header lang={lang as Lang} />
      <div id="contenu">{children}</div>
      <SiteFooter lang={lang as Lang} />
      <MobileBar lang={lang} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalClinic",
            name: "Centre Kinésithérapie Florida",
            medicalSpecialty: "Physiotherapy",
            currenciesAccepted: "MAD",
            telephone: phoneHref(centre.phone).replace("tel:", ""),
            email: centre.email || undefined,
            sameAs: [instagramHref(centre.instagram)],
            address: {
              "@type": "PostalAddress",
              streetAddress: centre.address,
              addressCountry: "MA",
            },
          }),
        }}
      />
    </div>
  );
}
