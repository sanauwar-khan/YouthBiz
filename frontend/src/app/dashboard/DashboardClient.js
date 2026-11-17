"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { dashboardRequest, loadDashboard } from "../_lib/dashboardApi";
import ProductSection from "../_components/ProductSection";
import InventorySection from "../_components/InventorySection";
import BusinessPitchSection from "../_components/BusinessPitchSection";
import ThemeToggle from "../_components/ThemeToggle";

const dashboardPages = {
  products: { title: "My Products", intro: "Create and manage the products you plan to make and sell." },
  inventory: { title: "Inventory Management", intro: "Track production, sales, and available stock for your products." },
  "business-pitch": { title: "Business Pitch & Pop-up", intro: "Build a pitch and plan the details of your next pop-up." },
};

export default function DashboardClient({ activePage = "products" }) {
  const router = useRouter();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function initialize() {
      try {
        const data = await loadDashboard(controller.signal);
        setDashboard(data);
        setLoadError("");
      } catch (error) {
        if (error.name === "AbortError") return;
        if (error.status === 401) {
          router.replace("/login");
          return;
        }
        setLoadError(error.message || "Your dashboard could not be loaded.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    initialize();
    return () => controller.abort();
  }, [router]);

  async function performAction(action) {
    setActionError("");
    setIsSaving(true);
    try {
      await action();
      const data = await loadDashboard();
      setDashboard(data);
      return true;
    } catch (error) {
      if (error.status === 401) {
        router.replace("/login");
        return false;
      }
      setActionError(error.message || "That change could not be saved. Please try again.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function logout() {
    setActionError("");
    setIsLoggingOut(true);
    try {
      await dashboardRequest("/auth/logout", { method: "POST" });
      setDashboard(null);
      router.replace("/");
      router.refresh();
    } catch (error) {
      if (error.status === 401) {
        setDashboard(null);
        router.replace("/");
        router.refresh();
        return;
      }
      setActionError(error.message || "Could not log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (isLoading) {
    return <main className="student-dashboard-page"><div aria-live="polite" className="dashboard-loading">Loading your workspace...</div></main>;
  }

  if (loadError) {
    return (
      <main className="student-dashboard-page">
        <div className="dashboard-load-error" role="alert">
          <strong>We couldn’t load your workspace.</strong>
          <p>{loadError}</p>
          <button className="button button-dark" onClick={() => window.location.reload()} type="button">Try again</button>
        </div>
      </main>
    );
  }

  if (!dashboard) return null;

  const { user, products, inventory, pitches } = dashboard;
  const currentPage = dashboardPages[activePage];

  return (
    <main className="student-dashboard-page">
      <header className="auth-header student-dashboard-header">
        <Link className="brand" href="/" aria-label="YouthBiz home">
          <span className="brand-mark" aria-hidden="true">Y</span>
          <span>YouthBiz</span>
        </Link>
        <nav aria-label="Dashboard navigation" className="student-dashboard-nav">
          <Link aria-current={activePage === "products" ? "page" : undefined} className={activePage === "products" ? "is-active" : undefined} href="/dashboard">My Products</Link>
          <Link aria-current={activePage === "inventory" ? "page" : undefined} className={activePage === "inventory" ? "is-active" : undefined} href="/dashboard/inventory">Inventory</Link>
          <Link aria-current={activePage === "business-pitch" ? "page" : undefined} className={activePage === "business-pitch" ? "is-active" : undefined} href="/dashboard/business-pitch">Business Pitch</Link>
        </nav>
        <div className="student-account-area">
          <span className="student-dashboard-label"><span aria-hidden="true" /> Student workspace</span>
          <ThemeToggle />
          <details className="student-profile">
            <summary aria-label={`Open ${user.firstName}'s profile`}>
              <span aria-hidden="true" className="student-profile-avatar">{user.firstName.charAt(0).toUpperCase()}</span>
              <span className="student-profile-summary"><strong>{user.firstName}</strong><small>Profile</small></span>
              <span aria-hidden="true" className="student-profile-chevron">⌄</span>
            </summary>
            <div className="student-profile-menu">
              <p className="eyebrow">Your account</p>
              <strong className="student-profile-name">{user.firstName} {user.lastName}</strong>
              <a className="student-profile-email" href={`mailto:${user.email}`}>{user.email}</a>
              <button className="student-profile-logout" disabled={isLoggingOut} onClick={logout} type="button">
                {isLoggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          </details>
        </div>
      </header>

      <section className="student-dashboard-content" aria-labelledby="dashboard-title">
        {currentPage ? (
          <>
            <h1 id="dashboard-title">{currentPage.title}</h1>
            <p className="student-dashboard-intro">{currentPage.intro}</p>
          </>
        ) : null}

        {actionError && <p className="dashboard-action-error" role="alert">{actionError}</p>}

        {activePage === "products" && <ProductSection isSaving={isSaving} onAction={performAction} products={products} />}
        {activePage === "inventory" && <InventorySection isSaving={isSaving} onAction={performAction} products={inventory} />}
        {activePage === "business-pitch" && <BusinessPitchSection isSaving={isSaving} onAction={performAction} pitches={pitches} products={products} />}
      </section>

      <footer className="auth-footer student-dashboard-footer">
        <Link href="/">← Back to YouthBiz</Link>
        <a href="mailto:hello@youthbiz.club">Get in touch</a>
      </footer>
    </main>
  );
}
