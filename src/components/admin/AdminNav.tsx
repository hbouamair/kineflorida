"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CalendarDays, Library, Menu, Settings, TrendingUp, X } from "lucide-react";
import { LogoutButton } from "./LogoutButton";

const links = [
  { href: "/admin", label: "Réservations", hint: "Calendrier et liste", icon: CalendarDays },
  { href: "/admin/revenus", label: "Revenus", hint: "Recettes encaissées", icon: TrendingUp },
  { href: "/admin/catalogue", label: "Catalogue", hint: "Soins et packs", icon: Library },
  { href: "/admin/parametres", label: "Paramètres", hint: "Lieu et horaires", icon: Settings },
];

export function AdminNav({ email }: { email: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const initials = email.split("@")[0]?.slice(0, 2).toUpperCase() || "KF";

  const nav = (
    <>
      <Link href="/admin" className="admin-brand" onClick={() => setOpen(false)}>
        <Image src="/logo.png" alt="" width={44} height={44} />
        <span>
          <strong>Florida</strong>
          <small>L&apos;agenda</small>
        </span>
      </Link>
      <nav>
        {links.map((link) => {
          const current = link.href === "/admin" ? path === "/admin" : path.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} aria-current={current ? "page" : undefined} onClick={() => setOpen(false)}>
              <span className="admin-nav-icon"><Icon size={16} aria-hidden /></span>
              <span>
                <strong>{link.label}</strong>
                <small>{link.hint}</small>
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="admin-user">
        <span>{initials}</span>
        <p>
          <strong>{email}</strong>
          <small>Administrateur</small>
        </p>
      </div>
      <LogoutButton />
    </>
  );

  return (
    <>
      <div className="admin-bar">
        <Link href="/admin" className="admin-brand">
          <Image src="/logo.png" alt="" width={36} height={36} />
          <strong>L&apos;agenda</strong>
        </Link>
        <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}>
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      <aside className={open ? "admin-side is-open" : "admin-side"}>{nav}</aside>
    </>
  );
}
