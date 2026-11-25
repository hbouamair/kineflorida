"use client";

import { useState } from "react";

export function LogoutButton() {
  const [pending, setPending] = useState(false);

  return (
    <button className="admin-quit" type="button" disabled={pending} onClick={async () => {
        setPending(true);
        await fetch("/api/admin/logout", { method: "POST" });
        window.location.href = "/admin/login";
      }}
    >
      Se déconnecter
    </button>
  );
}
