import type { FamilyId } from "@/content/catalog";
import type { Lang } from "@/lib/i18n";

export type Photo = { src: string; alt: Record<Lang, string> };

export const photos = {
  kine: {
    src: "/photos/kine.jpg",
    alt: { fr: "Douleur de la hanche", ar: "ألم الورك" },
  },
  joint: {
    src: "/photos/color.jpg",
    alt: { fr: "Articulation douloureuse", ar: "مفصل ملتهب" },
  },
  bones: {
    src: "/photos/bones.jpg",
    alt: { fr: "Os et articulations", ar: "عظام ومفاصل" },
  },
  exercice: {
    src: "/photos/exercice.jpg",
    alt: { fr: "Exercices thérapeutiques", ar: "تمارين علاجية" },
  },
  sport: {
    src: "/photos/sport.jpg",
    alt: { fr: "Exercice sportif", ar: "تمرين رياضي" },
  },
  aquabike: {
    src: "/photos/aquabike.jpg",
    alt: { fr: "Aquabike", ar: "دراجة مائية" },
  },
  glace: {
    src: "/photos/glace.jpg",
    alt: { fr: "Bain glacé", ar: "حمام جليدي" },
  },
} satisfies Record<string, Photo>;

export const familyPhoto: Partial<Record<FamilyId, Photo>> = {
  kine: { src: "/photos/pain-1.jpg", alt: { fr: "Douleur de la hanche", ar: "ألم الورك" } },
  slim: { src: "/photos/sport-1.jpg", alt: { fr: "Exercice sportif", ar: "تمرين رياضي" } },
  body: { src: "/photos/move-1.jpg", alt: { fr: "Exercices thérapeutiques", ar: "تمارين علاجية" } },
  water: { src: "/photos/aqua.jpg", alt: { fr: "Aquabike", ar: "دراجة مائية" } },
};

export const familyScenes: Partial<Record<FamilyId, Photo[]>> = {
  kine: [photos.kine, photos.bones],
  slim: [{ src: "/photos/sport-1.jpg", alt: { fr: "Exercice sportif", ar: "تمرين رياضي" } }],
  body: [{ src: "/photos/move-1.jpg", alt: { fr: "Exercices thérapeutiques", ar: "تمارين علاجية" } }],
  water: [
    { src: "/photos/aqua.jpg", alt: { fr: "Aquabike", ar: "دراجة مائية" } },
    { src: "/photos/ice.jpg", alt: { fr: "Bain glacé", ar: "حمام جليدي" } },
  ],
};
