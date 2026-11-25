import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { getSupabaseServer } from "@/lib/supabase/server";

export const instant = false;

async function Gate({ children }: { children: React.ReactNode }) {
  await connection();
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  return (
    <div className="admin-shell">
      <AdminNav email={user.email ?? ""} />
      <div className="admin-main">{children}</div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="login-wrap">Ouverture de l&apos;agenda…</p>}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}
