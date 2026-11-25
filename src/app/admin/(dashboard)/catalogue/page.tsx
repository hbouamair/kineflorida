import Image from "next/image";
import { addPack, addService, removeAdded, updatePack, updateService } from "@/app/admin/actions";
import { AdminDialog, DialogForm } from "@/components/admin/AdminDialog";
import { families, packs, services, type FamilyId } from "@/content/catalog";
import { familyPhoto } from "@/content/photos";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type AddedService = {
  id: string;
  family: FamilyId;
  name_fr: string;
  name_ar: string;
  minutes: number | null;
  price_mad: number;
};

type Price = { label_fr?: string; label_ar?: string; amount?: number };

type AddedPack = {
  id: string;
  name_fr: string;
  name_ar: string;
  detail_fr: string;
  detail_ar: string;
  minutes: number | null;
  prices: Price[];
};

function durationLabel(minutes: number | null) {
  if (!minutes) return "Durée non indiquée";
  if (minutes % 60 === 0) return `${minutes / 60} h`;
  return `${minutes} min`;
}

function ServiceFields({ row }: { row?: AddedService }) {
  return (
    <div className="admin-fields">
      {row ? <input type="hidden" name="id" value={row.id} /> : null}
      <label className="is-full">
        Famille
        <select className="admin-input" name="family" defaultValue={row?.family ?? "kine"}>
          {families.map((family) => (
            <option key={family.id} value={family.id}>{family.name.fr}</option>
          ))}
        </select>
      </label>
      <label>Nom français<input className="admin-input" name="name_fr" defaultValue={row?.name_fr} required /></label>
      <label>Nom arabe<input className="admin-input" name="name_ar" defaultValue={row?.name_ar} /></label>
      <label>
        Durée en minutes
        <input className="admin-input" name="minutes" type="number" min="1" defaultValue={row?.minutes ?? ""} placeholder="Vide = pas de créneau" />
      </label>
      <label>Prix DH<input className="admin-input" name="price" type="number" min="0" defaultValue={row?.price_mad} required /></label>
    </div>
  );
}

function PackFields({ row }: { row?: AddedPack }) {
  const first = row?.prices?.[0];
  const second = row?.prices?.[1];
  return (
    <div className="admin-fields">
      {row ? <input type="hidden" name="id" value={row.id} /> : null}
      <label>Nom français<input className="admin-input" name="name_fr" defaultValue={row?.name_fr} required /></label>
      <label>Nom arabe<input className="admin-input" name="name_ar" defaultValue={row?.name_ar} /></label>
      <label className="is-full">Détail français<input className="admin-input" name="detail_fr" defaultValue={row?.detail_fr} required /></label>
      <label className="is-full">Détail arabe<input className="admin-input" name="detail_ar" defaultValue={row?.detail_ar} /></label>
      <label className="is-full">
        Durée d&apos;une séance (min)
        <input className="admin-input" name="minutes" type="number" min="1" defaultValue={row?.minutes ?? ""} />
      </label>
      <label>Libellé du prix<input className="admin-input" name="label_fr" defaultValue={first?.label_fr} required placeholder="10 séances" /></label>
      <label>Montant DH<input className="admin-input" name="amount" type="number" min="0" defaultValue={first?.amount} required /></label>
      <label>Libellé arabe<input className="admin-input" name="label_ar" defaultValue={first?.label_ar} /></label>
      <label>Deuxième libellé<input className="admin-input" name="label_fr_2" defaultValue={second?.label_fr} /></label>
      <label>Deuxième montant<input className="admin-input" name="amount_2" type="number" min="0" defaultValue={second?.amount ?? ""} /></label>
      <label>Deuxième libellé arabe<input className="admin-input" name="label_ar_2" defaultValue={second?.label_ar} /></label>
    </div>
  );
}

export default async function CataloguePage() {
  let addedServices: AddedService[] = [];
  let addedPacks: AddedPack[] = [];
  let problem = "";
  try {
    const admin = getSupabaseAdmin();
    const [servicesResult, packsResult] = await Promise.all([
      admin.from("added_services").select("id, family, name_fr, name_ar, minutes, price_mad").order("created_at"),
      admin.from("added_packs").select("id, name_fr, name_ar, detail_fr, detail_ar, minutes, prices").order("created_at"),
    ]);
    const failure = servicesResult.error ?? packsResult.error;
    if (failure) {
      problem = /relation|does not exist|schema cache/i.test(failure.message)
        ? "Exécutez la fin de supabase/schema.sql pour créer added_services et added_packs."
        : "Supabase ne répond pas depuis ce réseau.";
    } else {
      addedServices = (servicesResult.data ?? []) as AddedService[];
      addedPacks = (packsResult.data ?? []) as AddedPack[];
    }
  } catch {
    problem = "Supabase ne répond pas depuis ce réseau.";
  }

  return (
    <div className="admin-page">
      <header className="admin-top">
        <div>
          <p className="admin-eyebrow">Catalogue</p>
          <h1>Soins et packs</h1>
          <p>Le catalogue imprimé reste verrouillé. Les ajouts se créent et se modifient dans une fenêtre.</p>
        </div>
        <div className="admin-top-actions">
          <AdminDialog kicker="Catalogue" label="Ajouter un soin" title="Nouveau soin" lede="Il apparaît sur le site avec le catalogue imprimé.">
            <DialogForm action={addService} submitLabel="Ajouter le soin">
              <ServiceFields />
            </DialogForm>
          </AdminDialog>
          <AdminDialog kicker="Catalogue" label="Ajouter un pack" title="Nouveau pack" className="admin-btn admin-btn-ghost">
            <DialogForm action={addPack} submitLabel="Ajouter le pack">
              <PackFields />
            </DialogForm>
          </AdminDialog>
        </div>
      </header>
      {problem ? <p className="note" role="alert">{problem}</p> : null}

      {families.map((family) => {
        const printed = services.filter((service) => service.family === family.id);
        const extra = addedServices.filter((service) => service.family === family.id);
        const photo = familyPhoto[family.id];
        return (
          <section key={family.id} className="admin-block">
            <header className="care-family">
              {photo ? (
                <span className="care-family-photo">
                  <Image src={photo.src} alt="" fill sizes="64px" />
                </span>
              ) : (
                <span className="care-family-mark" aria-hidden>F</span>
              )}
              <div>
                <h2>{family.name.fr}</h2>
                <p>{printed.length + extra.length} soins</p>
              </div>
            </header>
            <div className="care-board">
              {printed.map((service) => (
                <article key={service.id} className="care-card">
                  <div className="care-card-top">
                    <span className="care-pill">{family.name.fr}</span>
                    <span className="care-pill is-quiet">Imprimé</span>
                  </div>
                  <h3>{service.name.fr}</h3>
                  <p className="care-meta">{durationLabel(service.minutes)}</p>
                  <p className="care-price"><strong>{service.price}</strong><small>DH</small></p>
                </article>
              ))}
              {extra.map((service) => (
                <article key={service.id} className="care-card is-added">
                  <div className="care-card-top">
                    <span className="care-pill">{family.name.fr}</span>
                    <span className="care-pill">Ajouté</span>
                  </div>
                  <h3>{service.name_fr}</h3>
                  <p className="care-meta">{durationLabel(service.minutes)}</p>
                  <p className="care-price"><strong>{service.price_mad}</strong><small>DH</small></p>
                  <div className="care-card-foot">
                    <AdminDialog kicker="Catalogue" label="Modifier" className="admin-btn admin-btn-ghost" title={service.name_fr} lede="Les changements apparaissent sur le site.">
                      <DialogForm action={updateService} submitLabel="Enregistrer">
                        <ServiceFields row={service} />
                      </DialogForm>
                    </AdminDialog>
                    <AdminDialog kicker="Catalogue" label="Retirer" className="admin-btn is-danger" title="Retirer ce soin ?" lede="Il disparaît du site. Le catalogue imprimé ne change pas.">
                      <DialogForm action={removeAdded} submitLabel="Retirer" danger>
                        <input type="hidden" name="kind" value="service" />
                        <input type="hidden" name="id" value={service.id} />
                      </DialogForm>
                    </AdminDialog>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      <section className="admin-block">
        <header className="care-family">
          <span className="care-family-photo">
            <Image src="/photos/sport.jpg" alt="" fill sizes="64px" />
          </span>
          <div>
            <h2>Packs</h2>
            <p>{packs.length + addedPacks.length} formules</p>
          </div>
        </header>
        <div className="care-board">
          {packs.map((pack) => (
            <article key={pack.id} className="care-card">
              <div className="care-card-top">
                <span className="care-pill">Pack</span>
                <span className="care-pill is-quiet">Imprimé</span>
              </div>
              <h3>{pack.name.fr}</h3>
              <p className="care-meta">{pack.detail.fr}</p>
              <div className="care-prices">
                {pack.prices.map((price) => (
                  <p key={price.label.fr} className="care-price">
                    <strong>{price.amount}</strong><small>DH</small>
                    <em>{price.label.fr}</em>
                  </p>
                ))}
              </div>
            </article>
          ))}
          {addedPacks.map((pack) => {
            const amounts = (pack.prices ?? []).filter((price) => typeof price.amount === "number");
            return (
              <article key={pack.id} className="care-card is-added">
                <div className="care-card-top">
                  <span className="care-pill">Pack</span>
                  <span className="care-pill">Ajouté</span>
                </div>
                <h3>{pack.name_fr}</h3>
                <p className="care-meta">{pack.detail_fr}</p>
                <div className="care-prices">
                  {amounts.map((price) => (
                    <p key={`${price.label_fr}-${price.amount}`} className="care-price">
                      <strong>{price.amount}</strong><small>DH</small>
                      <em>{price.label_fr}</em>
                    </p>
                  ))}
                </div>
                <div className="care-card-foot">
                  <AdminDialog kicker="Catalogue" label="Modifier" className="admin-btn admin-btn-ghost" title={pack.name_fr} wide>
                    <DialogForm action={updatePack} submitLabel="Enregistrer">
                      <PackFields row={pack} />
                    </DialogForm>
                  </AdminDialog>
                  <AdminDialog kicker="Catalogue" label="Retirer" className="admin-btn is-danger" title="Retirer ce pack ?" lede="Il disparaît du site. Le catalogue imprimé ne change pas.">
                    <DialogForm action={removeAdded} submitLabel="Retirer" danger>
                      <input type="hidden" name="kind" value="pack" />
                      <input type="hidden" name="id" value={pack.id} />
                    </DialogForm>
                  </AdminDialog>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
