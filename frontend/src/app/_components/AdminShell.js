"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminRequest } from "../_lib/adminApi";

const navigation = [
  ["/admin", "Dashboard"],
  ["/admin/students", "Students"],
  ["/admin/products", "Products"],
  ["/admin/inventory", "Inventory"],
  ["/admin/business-pitches", "Business Pitches"],
  ["/admin/prds", "PRD Management"],
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    adminRequest("/auth/me", { signal: controller.signal })
      .then((result) => setAdmin(result.admin))
      .catch((requestError) => {
        if (requestError.name === "AbortError") return;
        if (requestError.status === 401) {
          router.replace("/admin/login");
          return;
        }
        setError(requestError.message || "Admin access could not be verified.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [router]);

  async function logout() {
    setLoggingOut(true);
    try {
      await adminRequest("/auth/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } catch (requestError) {
      setError(requestError.message || "Could not sign out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  if (isLoading) return <main className="admin-loading-screen">Loading admin workspace…</main>;
  if (!admin) {
    return (
      <main className="admin-loading-screen" role="alert">
        {error || "Redirecting to admin sign-in…"}
        {error && <button className="admin-button admin-button-secondary" onClick={() => router.replace("/admin/login")} type="button">Go to sign in</button>}
      </main>
    );
  }

  return (
    <div className={`admin-app${pathname === "/admin" ? " is-dashboard" : ""}`}>
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin" aria-label="YouthBiz admin home">
          <span className="admin-brand-mark">Y</span>
          <span>YouthBiz <small>ADMIN</small></span>
        </Link>
        <nav aria-label="Admin navigation" className="admin-sidebar-nav">
          <span className="admin-nav-label">WORKSPACE</span>
          {navigation.map(([href, label]) => {
            const active = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return <Link aria-current={active ? "page" : undefined} className={active ? "is-active" : undefined} href={href} key={href}>{label}</Link>;
          })}
        </nav>
        <div className="admin-sidebar-bottom">
          <span className="admin-access-indicator"><i /> Secure admin session</span>
          <Link className={pathname === "/admin/profile" ? "is-active" : undefined} href="/admin/profile">Profile</Link>
        </div>
      </aside>

      <div className="admin-main-column">
        <header className="admin-topbar">
          <div><span className="admin-topbar-kicker">YouthBiz control center</span><strong>Administration</strong></div>
          <div className="admin-topbar-account">
            <Link href="/admin/profile" className="admin-account-email">{admin.email}</Link>
            <button className="admin-button admin-button-quiet" disabled={loggingOut} onClick={logout} type="button">{loggingOut ? "Signing out…" : "Log out"}</button>
          </div>
        </header>
        {error && <div className="admin-shell-error" role="alert">{error}</div>}
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
