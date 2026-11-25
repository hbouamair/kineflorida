import type { Lang } from "@/lib/i18n";

export type FamilyId = "kine" | "slim" | "body" | "face" | "water";

export type Service = {
  id: string;
  family: FamilyId;
  minutes: number | null;
  price: number;
  name: Record<Lang, string>;
};

export type Pack = {
  id: string;
  name: Record<Lang, string>;
  detail: Record<Lang, string>;
  prices: { label: Record<Lang, string>; amount: number }[];
  minutes: number | null;
};

export const families: { id: FamilyId; name: Record<Lang, string> }[] = [
  { id: "kine", name: { fr: "Kinésithérapie", ar: "العلاج الطبيعي" } },
  { id: "slim", name: { fr: "Amincissement", ar: "التنحيف" } },
  { id: "body", name: { fr: "Bien-être du corps", ar: "عناية بالجسم" } },
  { id: "face", name: { fr: "Bien-être du visage", ar: "عناية بالوجه" } },
  { id: "water", name: { fr: "Balnéothérapie", ar: "العلاج بالمياه" } },
];

/** Prices and durations are the ones printed in the catalogue. Arabic names are translations, not yet approved by the centre. */
export const services: Service[] = [
  { id: "seance", family: "kine", minutes: 45, price: 250, name: { fr: "Séance kinésithérapie", ar: "حصة علاج طبيعي" } },
  { id: "consultation", family: "kine", minutes: 15, price: 100, name: { fr: "Consultation", ar: "استشارة" } },
  { id: "hijama", family: "kine", minutes: 30, price: 250, name: { fr: "Hijama médical", ar: "حجامة طبية" } },
  { id: "massage-medical", family: "kine", minutes: 60, price: 200, name: { fr: "Massage médical", ar: "تدليك طبي" } },
  { id: "drainage", family: "kine", minutes: 60, price: 300, name: { fr: "Drainage lymphatique", ar: "تصريف لمفاوي" } },
  { id: "choc", family: "kine", minutes: 30, price: 400, name: { fr: "Onde de choc", ar: "موجات صدمية" } },
  { id: "manuelle", family: "kine", minutes: null, price: 400, name: { fr: "Thérapie manuelle", ar: "علاج يدوي" } },
  { id: "massage-slim", family: "slim", minutes: 60, price: 200, name: { fr: "Massage amincissement", ar: "تدليك تنحيف" } },
  { id: "madero", family: "slim", minutes: 60, price: 200, name: { fr: "Madérothérapie", ar: "علاج بالخشب" } },
  { id: "couverture", family: "slim", minutes: null, price: 100, name: { fr: "Couverture chauffante", ar: "غطاء حراري" } },
  { id: "electro", family: "slim", minutes: null, price: 100, name: { fr: "Électrolipolyse", ar: "تحليل كهربائي للدهون" } },
  { id: "relaxant", family: "body", minutes: 60, price: 200, name: { fr: "Massage relaxant", ar: "تدليك استرخاء" } },
  { id: "pierre", family: "body", minutes: 60, price: 250, name: { fr: "Massage pierre chaude", ar: "تدليك بالحجارة الساخنة" } },
  { id: "cranien", family: "body", minutes: 45, price: 200, name: { fr: "Massage crânien", ar: "تدليك الرأس" } },
  { id: "reflexologie", family: "body", minutes: 60, price: 200, name: { fr: "Réflexologie", ar: "ريفليكسولوجيا" } },
  { id: "hydrafacial", family: "face", minutes: 90, price: 400, name: { fr: "Hydrafacial", ar: "هيدرافيشل" } },
  { id: "microneedling", family: "face", minutes: 30, price: 500, name: { fr: "Microneedling du visage et cheveux", ar: "وخز دقيق للوجه والشعر" } },
  { id: "hifu", family: "face", minutes: 30, price: 500, name: { fr: "HIFU du visage", ar: "هايفو للوجه" } },
  { id: "modelage", family: "face", minutes: null, price: 150, name: { fr: "Modelage", ar: "عناية تشكيلية" } },
  { id: "glace", family: "water", minutes: 15, price: 100, name: { fr: "Bain glacé", ar: "حمام جليدي" } },
  { id: "aquabike", family: "water", minutes: 45, price: 300, name: { fr: "Aquabike", ar: "دراجة مائية" } },
];

export const packs: Pack[] = [
  {
    id: "pack-sportif",
    name: { fr: "Pack massage sportif", ar: "باقة التدليك الرياضي" },
    detail: { fr: "10 séances, 1 h par séance", ar: "10 حصص، ساعة لكل حصة" },
    prices: [{ label: { fr: "10 séances", ar: "10 حصص" }, amount: 1800 }],
    minutes: 60,
  },
  {
    id: "pack-slim",
    name: { fr: "Pack massage amincissement", ar: "باقة تدليك التنحيف" },
    detail: { fr: "10 ou 20 séances", ar: "10 أو 20 حصة" },
    prices: [
      { label: { fr: "10 séances", ar: "10 حصص" }, amount: 1800 },
      { label: { fr: "20 séances", ar: "20 حصة" }, amount: 3000 },
    ],
    minutes: null,
  },
  {
    id: "pack-modelage",
    name: { fr: "Pack modelage facial", ar: "باقة عناية الوجه" },
    detail: { fr: "10 séances", ar: "10 حصص" },
    prices: [{ label: { fr: "10 séances", ar: "10 حصص" }, amount: 1500 }],
    minutes: null,
  },
  {
    id: "pack-micro",
    name: { fr: "Pack microneedling des cheveux", ar: "باقة الوخز الدقيق للشعر" },
    detail: { fr: "5 séances + sérum", ar: "5 حصص + مصل" },
    prices: [{ label: { fr: "5 séances + sérum", ar: "5 حصص + مصل" }, amount: 2000 }],
    minutes: null,
  },
];

export const bookable = services.filter((service) => service.minutes !== null);

export function findService(id: string) {
  return services.find((service) => service.id === id);
}

export function formatMinutes(minutes: number | null, lang: Lang) {
  if (minutes === null) {
    return lang === "fr" ? "Durée non imprimée" : "المدة غير مطبوعة";
  }
  if (minutes === 90) return lang === "fr" ? "1 h 30" : "1 س 30 د";
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return lang === "fr" ? `${hours} h` : `${hours} س`;
  }
  return lang === "fr" ? `${minutes} min` : `${minutes} د`;
}

export function formatPrice(amount: number) {
  return `\u2066${amount} DH\u2069`;
}
