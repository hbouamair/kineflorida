import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree, IBM_Plex_Sans_Arabic, Italianno } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

const body = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-ar",
});

const italianno = Italianno({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
});

export const metadata: Metadata = {
  title: { default: "Centre Kinésithérapie Florida", template: "%s · Centre Kinésithérapie Florida" },
  description: "Centre Kinésithérapie Florida, Sidi Maarouf. Le catalogue, les packs, et la prise d'heure.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable} ${plexArabic.variable} ${italianno.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
