import AdminShell from "../../_components/AdminShell";
import { Suspense } from "react";

export default function ProtectedAdminLayout({ children }) {
  return <Suspense fallback={<main className="admin-loading-screen">Loading admin workspace…</main>}><AdminShell>{children}</AdminShell></Suspense>;
}
