import { saveHours, savePlace } from "@/app/admin/actions";
import { AdminDialog, DialogForm } from "@/components/admin/AdminDialog";
import { minutesLabel } from "@/lib/agenda";
import { loadCentre } from "@/lib/centre";
import { loadHours, type DayHours } from "@/lib/hours";

const names = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const order = [1, 2, 3, 4, 5, 6, 0];

function PlaceFields({ address, phone, instagram, email }: { address: string; phone: string; instagram: string; email: string }) {
  return (
    <>
      <label>
        Adresse
        <textarea className="admin-input" name="address" rows={3} defaultValue={address} required />
      </label>
      <label>
        Téléphone
        <input className="admin-input" name="phone" defaultValue={phone} dir="ltr" required />
      </label>
      <label>
        Instagram
        <input className="admin-input" name="instagram" defaultValue={instagram} dir="ltr" />
      </label>
      <label>
        Email du centre
        <input className="admin-input" name="email" type="email" defaultValue={email} dir="ltr" placeholder="Laisser vide tant qu'il n'est pas confirmé" />
      </label>
    </>
  );
}

function HourFields({ byDay }: { byDay: Map<number, DayHours> }) {
  return (
    <div className="admin-hours">
      {order.map((weekday) => {
        const row = byDay.get(weekday) as DayHours;
        return (
          <fieldset key={weekday}>
            <legend>{names[weekday]}</legend>
            <label className="admin-check">
              <input type="checkbox" name={`open-${weekday}`} value="1" defaultChecked={row.isOpen} />
              Ouvert
            </label>
            <label>
              De
              <input className="admin-input" type="time" name={`from-${weekday}`} defaultValue={minutesLabel(row.openMinutes)} />
            </label>
            <label>
              À
              <input className="admin-input" type="time" name={`to-${weekday}`} defaultValue={minutesLabel(row.closeMinutes)} />
            </label>
          </fieldset>
        );
      })}
    </div>
  );
}

export default async function SettingsPage() {
  const [{ centre, ready }, hours] = await Promise.all([loadCentre(), loadHours()]);
  const byDay = new Map(hours.map((row) => [row.weekday, row]));

  return (
    <div className="admin-page">
      <header className="admin-top">
        <div>
          <p className="admin-eyebrow">Centre</p>
          <h1>Paramètres</h1>
          <p>Le lieu et les horaires s&apos;affichent ici. La modification s&apos;ouvre dans une fenêtre.</p>
        </div>
      </header>
      {ready ? null : (
        <p className="note" role="alert">
          La table centre_settings n&apos;existe pas encore. Exécutez la fin de supabase/schema.sql dans l&apos;éditeur SQL.
        </p>
      )}
      <div className="admin-split">
        <section className="admin-card admin-panel">
          <div className="admin-card-head">
            <h2>Le lieu</h2>
            <AdminDialog kicker="Paramètres" label="Modifier" className="admin-btn admin-btn-ghost" title="Modifier le lieu" lede="Ces informations remplacent l'adresse et le contact sur le site.">
              <DialogForm action={savePlace} submitLabel="Enregistrer">
                <PlaceFields address={centre.address} phone={centre.phone} instagram={centre.instagram} email={centre.email} />
              </DialogForm>
            </AdminDialog>
          </div>
          <dl className="admin-facts">
            <div>
              <dt>Adresse</dt>
              <dd>{centre.address}</dd>
            </div>
            <div>
              <dt>Téléphone</dt>
              <dd dir="ltr">{centre.phone}</dd>
            </div>
            <div>
              <dt>Instagram</dt>
              <dd dir="ltr">{centre.instagram}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{centre.email || "À confirmer"}</dd>
            </div>
          </dl>
        </section>
        <section className="admin-card admin-panel">
          <div className="admin-card-head">
            <h2>Horaires d&apos;ouverture</h2>
            <AdminDialog kicker="Paramètres" label="Modifier" className="admin-btn admin-btn-ghost" title="Horaires par jour" lede="Un jour décoché est fermé. Ces heures décident des créneaux." wide>
              <DialogForm action={saveHours} submitLabel="Enregistrer les horaires">
                <HourFields byDay={byDay} />
              </DialogForm>
            </AdminDialog>
          </div>
          <div className="admin-day-strip">
            {order.map((weekday) => {
              const row = byDay.get(weekday) as DayHours;
              return (
                <article key={weekday} className={row.isOpen ? undefined : "is-closed"}>
                  <strong>{names[weekday].slice(0, 3)}</strong>
                  <span>{row.isOpen ? `${minutesLabel(row.openMinutes)} – ${minutesLabel(row.closeMinutes)}` : "Fermé"}</span>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
