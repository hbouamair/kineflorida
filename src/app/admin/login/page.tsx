"use client";

import { useState } from "react";
import Image from "next/image";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          password: data.get("password"),
        }),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setError(payload.error || "Connexion impossible.");
        setPending(false);
        return;
      }
      window.location.href = "/admin";
    } catch {
      setError("Connexion impossible.");
      setPending(false);
    }
  }

  return (
    <main className="login-split">
      <section className="login-hero">
        <Image src="/logo.png" alt="" width={84} height={84} />
        <p className="script">By S.B</p>
        <h1>L&apos;agenda du centre</h1>
        <p>Confirmez, annulez et marquez le paiement. Le patient ne voit pas cette page.</p>
      </section>
      <section className="login-panel">
        <form className="form" onSubmit={submit}>
          <h2>Connexion</h2>
          <label>
            Email
            <input className="book-input" name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            Mot de passe
            <input className="book-input" name="password" type="password" autoComplete="current-password" required />
          </label>
          {error ? <p className="note" role="alert">{error}</p> : null}
          <button className="book-btn-primary" type="submit" disabled={pending}>{pending ? "Connexion…" : "Entrer"}</button>
        </form>
      </section>
    </main>
  );
}
