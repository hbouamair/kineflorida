export const langs = ["fr", "ar"] as const;
export type Lang = (typeof langs)[number];

export function isLang(value: string): value is Lang {
  return value === "fr" || value === "ar";
}

export function otherLang(lang: Lang): Lang {
  return lang === "fr" ? "ar" : "fr";
}
