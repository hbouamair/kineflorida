/** Client home-only preview. Set NEXT_PUBLIC_HOME_ONLY=1 to lock the public site to /fr and /ar. */
export const homeOnly = process.env.NEXT_PUBLIC_HOME_ONLY === "1";
