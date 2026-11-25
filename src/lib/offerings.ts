import { families, packs, services, type Pack, type Service } from "@/content/catalog";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type AddedService = {
  id: string;
  family: Service["family"];
  name_fr: string;
  name_ar: string;
  minutes: number | null;
  price_mad: number;
};

type AddedPack = {
  id: string;
  name_fr: string;
  name_ar: string;
  detail_fr: string;
  detail_ar: string;
  minutes: number | null;
  prices: { label_fr?: string; label_ar?: string; amount?: number }[];
};

function asService(row: AddedService): Service {
  return {
    id: row.id,
    family: row.family,
    minutes: row.minutes,
    price: row.price_mad,
    name: { fr: row.name_fr, ar: row.name_ar || row.name_fr },
  };
}

function asPack(row: AddedPack): Pack {
  const prices = (Array.isArray(row.prices) ? row.prices : [])
    .filter((price) => typeof price.amount === "number")
    .map((price) => ({
      label: { fr: price.label_fr || "", ar: price.label_ar || price.label_fr || "" },
      amount: price.amount as number,
    }));
  return {
    id: row.id,
    name: { fr: row.name_fr, ar: row.name_ar || row.name_fr },
    detail: { fr: row.detail_fr, ar: row.detail_ar || row.detail_fr },
    minutes: row.minutes,
    prices,
  };
}

export async function loadOfferings() {
  const extraServices: Service[] = [];
  const extraPacks: Pack[] = [];
  try {
    const admin = getSupabaseAdmin();
    const [servicesResult, packsResult] = await Promise.all([
      admin.from("added_services").select("id, family, name_fr, name_ar, minutes, price_mad").order("created_at"),
      admin.from("added_packs").select("id, name_fr, name_ar, detail_fr, detail_ar, minutes, prices").order("created_at"),
    ]);
    if (!servicesResult.error) {
      extraServices.push(...((servicesResult.data ?? []) as AddedService[]).map(asService));
    }
    if (!packsResult.error) {
      extraPacks.push(...((packsResult.data ?? []) as AddedPack[]).filter((row) => row.prices?.length).map(asPack));
    }
  } catch {
    // The printed catalogue still renders when Supabase is unreachable.
  }
  return {
    families,
    services: [...services, ...extraServices],
    packs: [...packs, ...extraPacks.filter((pack) => pack.prices.length > 0)],
  };
}

export function findOffering(list: Service[], id: string) {
  const service = list.find((item) => item.id === id);
  if (!service || service.minutes === null) return null;
  return service;
}
