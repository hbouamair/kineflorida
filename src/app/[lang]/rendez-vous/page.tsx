import { CareWizard } from "@/components/booking/CareWizard";
import { copy } from "@/content/copy";
import { isLang, type Lang } from "@/lib/i18n";
import { loadOfferings } from "@/lib/offerings";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: copy[lang].bookTitle };
}

async function BookGate({
  lang,
  searchParams,
}: {
  lang: Lang;
  searchParams: Promise<{ soin?: string }>;
}) {
  const { soin } = await searchParams;
  const { services } = await loadOfferings();
  return <CareWizard lang={lang} initialService={soin} cares={services.filter((service) => service.minutes !== null)} />;
}

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ soin?: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const text = copy[lang];

  return (
    <main className="book-shell">
      <header className="page-hero">
        <div className="shell">
          <p className="script">By S.B</p>
          <h1>{text.bookTitle}</h1>
          <p className="lede">{text.bookLede}</p>
        </div>
      </header>
      <div className="shell book-stage">
        <Suspense fallback={<p className="book-wait">{text.slots}</p>}>
          <BookGate lang={lang} searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
