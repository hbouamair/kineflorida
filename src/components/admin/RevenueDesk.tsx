"use client";

import { useState } from "react";
import { addMonths, format, parseISO, startOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { Banknote, CalendarRange, Wallet } from "lucide-react";
import { formatPrice } from "@/content/catalog";
import { ControlledDialog } from "@/components/admin/AdminDialog";

export type RevenueRow = {
  id: string;
  date: string;
  price_mad: number;
  customer_name: string;
  customer_email: string;
  service_name: string;
};

type Focus =
  | { kind: "month"; key: string; title: string }
  | { kind: "care"; key: string; title: string }
  | { kind: "patient"; key: string; title: string }
  | null;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function RevenueDesk({ now: nowIso, paid, due }: { now: string; paid: RevenueRow[]; due: number }) {
  const [focus, setFocus] = useState<Focus>(null);
  const now = new Date(nowIso);
  const thisMonthKey = format(now, "yyyy-MM");
  const lastMonthKey = format(subMonths(now, 1), "yyyy-MM");
  const sum = (rows: RevenueRow[]) => rows.reduce((total, row) => total + row.price_mad, 0);
  const thisMonth = sum(paid.filter((row) => row.date.startsWith(thisMonthKey)));
  const lastMonth = sum(paid.filter((row) => row.date.startsWith(lastMonthKey)));
  const allTime = sum(paid);

  const monthStart = startOfMonth(subMonths(now, 11));
  const months = Array.from({ length: 12 }, (_, index) => addMonths(monthStart, index)).map((month) => {
    const key = format(month, "yyyy-MM");
    const monthRows = paid.filter((row) => row.date.startsWith(key));
    return { key, label: format(month, "MMM yy", { locale: fr }), total: sum(monthRows), count: monthRows.length };
  });
  const maxMonth = Math.max(...months.map((month) => month.total), 1);

  const careMap = new Map<string, { name: string; total: number; count: number }>();
  for (const row of paid) {
    const entry = careMap.get(row.service_name) ?? { name: row.service_name, total: 0, count: 0 };
    entry.total += row.price_mad;
    entry.count += 1;
    careMap.set(row.service_name, entry);
  }
  const cares = [...careMap.values()].sort((a, b) => b.total - a.total);
  const maxCare = Math.max(...cares.map((care) => care.total), 1);

  const patientMap = new Map<string, { name: string; email: string; total: number; count: number }>();
  for (const row of paid) {
    const key = row.customer_email.toLowerCase();
    const entry = patientMap.get(key) ?? { name: row.customer_name, email: row.customer_email, total: 0, count: 0 };
    entry.total += row.price_mad;
    entry.count += 1;
    patientMap.set(key, entry);
  }
  const patients = [...patientMap.values()].sort((a, b) => b.total - a.total).slice(0, 8);

  const lines = paid.filter((row) => {
    if (!focus) return false;
    if (focus.kind === "month") return row.date.startsWith(focus.key);
    if (focus.kind === "care") return row.service_name === focus.key;
    return row.customer_email.toLowerCase() === focus.key;
  });

  const change = lastMonth === 0 ? null : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

  const tiles: { label: string; value: string; icon: typeof Banknote; note?: string }[] = [
    { label: "Total encaissé", value: formatPrice(allTime), icon: Banknote },
    { label: "Ce mois-ci", value: formatPrice(thisMonth), icon: CalendarRange, note: change === null ? undefined : `${change >= 0 ? "+" : ""}${change} %` },
    { label: "Mois dernier", value: formatPrice(lastMonth), icon: CalendarRange },
    { label: "À encaisser", value: formatPrice(due), icon: Wallet },
  ];

  return (
    <div className="admin-page rev">
      <header className="admin-top">
        <div>
          <p className="admin-eyebrow">Finance</p>
          <h1>Revenus</h1>
        </div>
      </header>
      <div className="rev-tiles">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <article key={tile.label}>
              <span><Icon size={18} aria-hidden /></span>
              <small>{tile.label}</small>
              <strong>{tile.value}</strong>
              {tile.note ? <em>{tile.note}</em> : null}
            </article>
          );
        })}
      </div>
      <section className="rev-chart">
        <header>
          <h2>Douze mois</h2>
          <p>{paid.length} paiement{paid.length === 1 ? "" : "s"}</p>
        </header>
        <div className="rev-bars">
          {months.map((month) => (
            <button
              key={month.key}
              type="button"
              className={month.key === thisMonthKey ? "is-now" : undefined}
              onClick={() => setFocus({ kind: "month", key: month.key, title: month.label })}
            >
              <span>{month.total > 0 ? month.total : "0"}</span>
              <b>
                <i style={{ height: `${Math.max((month.total / maxMonth) * 100, month.total > 0 ? 8 : 3)}%` }} />
              </b>
              <small>{month.label}</small>
            </button>
          ))}
        </div>
      </section>
      <div className="rev-grid">
        <section className="rev-panel">
          <header>
            <h2>Par soin</h2>
            <p>{cares.length} ligne{cares.length === 1 ? "" : "s"}</p>
          </header>
          {cares.length === 0 ? <p className="rev-empty">Les soins payés apparaîtront ici.</p> : null}
          <div className="rev-cares">
            {cares.map((care, index) => (
              <button key={care.name} type="button" onClick={() => setFocus({ kind: "care", key: care.name, title: care.name })}>
                <span className="rev-rank">{index + 1}</span>
                <span>
                  <strong>{care.name}</strong>
                  <small>{care.count} réservation{care.count > 1 ? "s" : ""}</small>
                  <i style={{ width: `${(care.total / maxCare) * 100}%` }} />
                </span>
                <b>{formatPrice(care.total)}</b>
              </button>
            ))}
          </div>
        </section>
        <section className="rev-panel">
          <header>
            <h2>Patients</h2>
            <p>Les plus élevés</p>
          </header>
          {patients.length === 0 ? <p className="rev-empty">Les patients apparaissent dès le premier paiement.</p> : null}
          <ol className="rev-people">
            {patients.map((person) => (
              <li key={person.email}>
                <button type="button" onClick={() => setFocus({ kind: "patient", key: person.email.toLowerCase(), title: person.name })}>
                  <span aria-hidden>{initials(person.name) || "KF"}</span>
                  <p>
                    <strong>{person.name}</strong>
                    <small>{person.email} · {person.count}</small>
                  </p>
                  <b>{formatPrice(person.total)}</b>
                </button>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <ControlledDialog
        open={focus !== null}
        kicker="Revenus"
        title={focus?.title ?? "Détail"}
        lede={lines.length ? `${formatPrice(sum(lines))} · ${lines.length} paiement${lines.length > 1 ? "s" : ""}` : "Aucun paiement."}
        onClose={() => setFocus(null)}
        wide
      >
        <ul className="admin-detail">
          {lines.map((row) => (
            <li key={row.id}>
              <span>{format(parseISO(row.date), "d MMM yyyy", { locale: fr })}</span>
              <strong>{row.customer_name}</strong>
              <em>{row.service_name}</em>
              <b>{formatPrice(row.price_mad)}</b>
            </li>
          ))}
        </ul>
      </ControlledDialog>
    </div>
  );
}
