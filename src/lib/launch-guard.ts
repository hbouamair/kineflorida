export const missingFacts = [
  "adresse",
  "téléphone",
  "email",
  "horaires confirmés par le centre",
  "nom complet derrière les initiales S.B.",
  "durée non imprimée: thérapie manuelle, couverture chauffante, électrolipolyse, modelage",
  "mentions légales (ICE, IF, RC)",
  "nom de domaine",
  "traductions arabes validées par le centre",
];

export function warnMissingFacts() {
  const message = `Centre Kiné Florida, faits manquants avant mise en ligne:\n${missingFacts.map((fact) => `- ${fact}`).join("\n")}`;
  if (process.env.LAUNCH_STRICT === "1") {
    throw new Error(message);
  }
  console.warn(message);
}
