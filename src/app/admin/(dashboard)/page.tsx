import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarRange, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { setBookingStatus, setPaymentStatus } from "@/app/admin/actions";
import { paymentLabel, statusLabel, type Booking } from "@/lib/booking";
import { minutesLabel } from "@/lib/agenda";
import { formatPrice } from "@/content/catalog";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type Query = {
  week?: string;
  view?: string;
  q?: string;
};

function weekStart(value?: string) {
  const base = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseISO(value) : new Date();
  return startOfWeek(base, { weekStartsOn: 1 });
}

function sessionDate(date: string) {
  return format(parseISO(date), "EEE d MMM yyyy", { locale: fr });
}

function createdLabel(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Casablanca",
  });
}

function href(query: Query, patch: Query) {
  const params = new URLSearchParams();
  const merged = { ...query, ...patch };
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value);
  }
  const text = params.toString();
  return text ? `/admin?${text}` : "/admin";
}

async function Board({ searchParams }: { searchParams: Promise<Query> }) {
  await connection();
  const query = await searchParams;
  const start = weekStart(query.week);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const from = format(days[0], "yyyy-MM-dd");
  const to = format(days[6], "yyyy-MM-dd");
  const view = query.view === "passed" || query.view === "archive" ? query.view : "active";
  const search = (query.q ?? "").replace(/[,()%]/g, "").trim();

  let weekRows: Booking[] = [];
  let list: Booking[] = [];
  let revenue = 0;
  let pendingCount = 0;
  let confirmedCount = 0;
  let passedCount = 0;
  let archiveCount = 0;
  let problem = "";
  try {
    const admin = getSupabaseAdmin();
    const weekQuery = admin
      .from("bookings")
      .select("*")
      .gte("date", from)
      .lte("date", to)
      .in("status", ["pending", "confirmed", "completed"])
      .order("start_minutes", { ascending: true });

    let listQuery = admin.from("bookings").select("*").order("date", { ascending: false }).order("start_minutes", { ascending: false }).limit(200);
    if (view === "archive") listQuery = listQuery.eq("status", "cancelled");
    else if (view === "passed") listQuery = listQuery.eq("status", "completed");
    else listQuery = listQuery.in("status", ["pending", "confirmed"]);
    if (search) {
      listQuery = listQuery.or(
        `customer_name.ilike.%${search}%,reference.ilike.%${search}%,customer_phone.ilike.%${search}%,customer_email.ilike.%${search}%`,
      );
    }

    const paidQuery = admin.from("bookings").select("price_mad, status").eq("payment_status", "paid");
    const count = (status: string) => admin.from("bookings").select("id", { count: "exact", head: true }).eq("status", status);
    const [weekResult, listResult, paidResult, pendingResult, confirmedResult, passedResult, archiveResult] = await Promise.all([
      weekQuery,
      listQuery,
      paidQuery,
      count("pending"),
      count("confirmed"),
      count("completed"),
      count("cancelled"),
    ]);
    const failure = weekResult.error ?? listResult.error ?? paidResult.error;
    if (failure) {
      problem = /relation|does not exist|schema cache/i.test(failure.message)
        ? "La table bookings n'existe pas encore. Exécutez supabase/schema.sql dans l'éditeur SQL Supabase."
        : "Supabase ne répond pas depuis ce réseau.";
    } else {
      weekRows = (weekResult.data ?? []) as Booking[];
      list = (listResult.data ?? []) as Booking[];
      revenue = ((paidResult.data ?? []) as { price_mad: number; status: string }[])
        .filter((row) => row.status !== "cancelled")
        .reduce((sum, row) => sum + row.price_mad, 0);
      pendingCount = pendingResult.count ?? 0;
      confirmedCount = confirmedResult.count ?? 0;
      passedCount = passedResult.count ?? 0;
      archiveCount = archiveResult.count ?? 0;
    }
  } catch {
    problem = "Supabase ne répond pas depuis ce réseau.";
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const weekCountLabel = `${weekRows.length} réservation${weekRows.length === 1 ? "" : "s"}`;

  return (
    <div className="admin-page">
      <header className="admin-top">
        <div>
          <p className="admin-eyebrow">Agenda</p>
          <h1>Réservations</h1>
          <p>Calendrier de la semaine, confirmation et encaissement.</p>
        </div>
        <a className="admin-btn" href={`/api/admin/export?view=${view}`}>Exporter Excel</a>
      </header>

      <div className="admin-kpis">
        <article><small>En attente</small><strong>{pendingCount}</strong></article>
        <article><small>Confirmés</small><strong>{confirmedCount}</strong></article>
        <article><small>Cette semaine</small><strong>{weekRows.length}</strong></article>
        <article><small>Recettes encaissées</small><strong>{formatPrice(revenue)}</strong></article>
      </div>

      {problem ? <p className="note" role="alert">{problem}</p> : null}
      {pendingCount > 0 ? (
        <p className="admin-alert">
          <strong>{pendingCount}</strong> réservation{pendingCount > 1 ? "s" : ""} en attente de confirmation.
        </p>
      ) : null}

      <section className="admin-block">
        <div className="admin-heading">
          <span className="admin-heading-icon"><CalendarRange size={16} aria-hidden /></span>
          <div>
            <h2>Calendrier de la semaine</h2>
            <p>{weekCountLabel}</p>
          </div>
        </div>
        <div className="admin-card admin-cal">
          <div className="admin-cal-nav">
            <Link href={href(query, { week: format(addDays(start, -7), "yyyy-MM-dd") })} aria-label="Semaine précédente">
              <ChevronLeft size={16} aria-hidden />
            </Link>
            <strong>
              {format(start, "d MMM", { locale: fr })} – {format(days[6], "d MMM yyyy", { locale: fr })}
            </strong>
            <Link href={href(query, { week: format(addDays(start, 7), "yyyy-MM-dd") })} aria-label="Semaine suivante">
              <ChevronRight size={16} aria-hidden />
            </Link>
          </div>
          <div className="admin-week">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const items = weekRows.filter((row) => row.date === key);
              const isToday = key === today;
              return (
                <section key={key} className={isToday ? "is-today" : undefined}>
                  <h3>{format(day, "EEE d", { locale: fr })}</h3>
                  {items.length === 0 ? <p className="admin-free">—</p> : null}
                  {items.map((row) => (
                    <article key={row.id} className={`admin-week-card is-${row.status}`} title={`${row.reference} · ${row.customer_name}`}>
                      <strong>{minutesLabel(row.start_minutes)} – {minutesLabel(row.start_minutes + row.duration_minutes)}</strong>
                      <span>{row.service_name}</span>
                      <span>{row.customer_name}</span>
                    </article>
                  ))}
                </section>
              );
            })}
          </div>
          <div className="admin-legend">
            <span><i className="is-pending" /> En attente</span>
            <span><i className="is-confirmed" /> Confirmée</span>
            <span><i className="is-completed" /> Terminée</span>
          </div>
        </div>
      </section>

      <section className="admin-block">
        <div className="admin-heading">
          <div>
            <h2>
              {view === "archive"
                ? "Archives des réservations"
                : view === "passed"
                  ? "Réservations passées"
                  : "Liste des réservations"}
            </h2>
            <p>
              {list.length > 0
                ? `${list.length} résultat${list.length > 1 ? "s" : ""}`
                : view === "archive"
                  ? "Annulées — masquées de la liste principale."
                  : "Recherche, confirmation et encaissement."}
            </p>
          </div>
        </div>
        <div className="admin-card admin-toolbar">
          <nav className="admin-tabs" role="tablist" aria-label="Actives, passées ou archives">
            <Link href={href(query, { view: "" })} role="tab" aria-selected={view === "active"}>Actives <span>{pendingCount + confirmedCount}</span></Link>
            <Link href={href(query, { view: "passed" })} role="tab" aria-selected={view === "passed"}>Passées <span>{passedCount}</span></Link>
            <Link href={href(query, { view: "archive" })} role="tab" aria-selected={view === "archive"}>Archives <span>{archiveCount}</span></Link>
          </nav>
          <form className="admin-filters" action="/admin">
            <input type="hidden" name="week" value={format(start, "yyyy-MM-dd")} />
            {view === "active" ? null : <input type="hidden" name="view" value={view} />}
            <label className="admin-search">
              <Search size={16} aria-hidden />
              <input className="admin-input" name="q" defaultValue={query.q ?? ""} placeholder="Patient, référence, téléphone…" aria-label="Rechercher une réservation" />
            </label>
            <button className="admin-btn admin-btn-ghost" type="submit">Filtrer</button>
          </form>
          {view === "archive" ? <p className="admin-filter-note">Annulées — masquées de la liste principale.</p> : null}
        </div>
        {list.length === 0 && !problem ? (
          <div className="admin-card admin-empty">
            <p>Aucune réservation trouvée avec ces filtres.</p>
          </div>
        ) : (
          <div className="admin-card admin-table-card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Date séance</th>
                  <th>Créée le</th>
                  <th>Patient</th>
                  <th>Soin</th>
                  <th>Prix</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => {
                  const open = row.status === "pending" || row.status === "confirmed";
                  const billable = row.status === "confirmed" || row.status === "completed";
                  return (
                    <tr key={row.id}>
                      <td className="admin-ref">{row.reference}</td>
                      <td>
                        <span className="admin-when">{sessionDate(row.date)}</span>
                        <span className="admin-meta">
                          {minutesLabel(row.start_minutes)} – {minutesLabel(row.start_minutes + row.duration_minutes)} ({row.duration_minutes} min)
                        </span>
                      </td>
                      <td className="admin-meta">{row.created_at ? createdLabel(row.created_at) : "—"}</td>
                      <td>
                        <strong>{row.customer_name}</strong>
                        <span className="admin-meta" dir="ltr">{row.customer_phone}</span>
                      </td>
                      <td>{row.service_name}</td>
                      <td className="admin-price">
                        {formatPrice(row.price_mad)}
                        {billable ? <span className="admin-meta">{row.payment_status === "paid" ? "Encaissé" : "Hors recettes"}</span> : null}
                      </td>
                      <td>
                        <span className={`admin-badge is-${row.status}`}>{statusLabel[row.status]}</span>
                        {billable ? <span className={`admin-pay is-${row.payment_status}`}>{paymentLabel[row.payment_status]}</span> : null}
                      </td>
                      <td>
                        <div className="admin-actions">
                          {row.status === "pending" ? (
                            <form action={setBookingStatus}>
                              <input type="hidden" name="id" value={row.id} />
                              <input type="hidden" name="status" value="confirmed" />
                              <button className="is-lime" type="submit">Confirmer</button>
                            </form>
                          ) : null}
                          {billable && row.payment_status === "unpaid" ? (
                            <form action={setPaymentStatus}>
                              <input type="hidden" name="id" value={row.id} />
                              <input type="hidden" name="payment" value="paid" />
                              <button className="is-gold" type="submit">Paiement reçu</button>
                            </form>
                          ) : null}
                          {row.status === "confirmed" ? (
                            <form action={setBookingStatus}>
                              <input type="hidden" name="id" value={row.id} />
                              <input type="hidden" name="status" value="completed" />
                              <button className="is-cream" type="submit">Terminer</button>
                            </form>
                          ) : null}
                          {open ? (
                            <form action={setBookingStatus}>
                              <input type="hidden" name="id" value={row.id} />
                              <input type="hidden" name="status" value="cancelled" />
                              <button className="is-rose" type="submit">Annuler</button>
                            </form>
                          ) : null}
                          {billable && row.payment_status === "paid" ? (
                            <form action={setPaymentStatus}>
                              <input type="hidden" name="id" value={row.id} />
                              <input type="hidden" name="payment" value="unpaid" />
                              <button className="is-quiet" type="submit">Annuler le paiement</button>
                            </form>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function AdminPage({ searchParams }: { searchParams: Promise<Query> }) {
  return (
    <Suspense fallback={<p>Chargement de la semaine…</p>}>
      <Board searchParams={searchParams} />
    </Suspense>
  );
}
