"use client";

import { useAdminData } from "../_lib/useAdminData";
import { ErrorState, formatAdminDate, LoadingState, PageHeading } from "./AdminUI";

export default function AdminProfileClient() {
  const { result, error, isLoading } = useAdminData("/auth/me");
  return (
    <>
      <PageHeading title="Profile" description="Administrator account and secure session details." />
      {isLoading && <LoadingState>Loading account…</LoadingState>}
      {error && <ErrorState>{error}</ErrorState>}
      {result && <section className="admin-panel admin-profile-panel">
        <div className="admin-profile-avatar" aria-hidden="true">{result.admin.email.slice(0, 1).toUpperCase()}</div>
        <div><p className="admin-eyebrow">Administrator</p><h2>{result.admin.email}</h2><p>Created {formatAdminDate(result.admin.createdAt)}</p><span className="admin-status is-healthy">Active account</span></div>
      </section>}
    </>
  );
}
