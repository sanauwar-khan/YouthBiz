"use client";

import Link from "next/link";
import { useAdminData } from "../_lib/useAdminData";
import { EmptyState, ErrorState, formatAdminCurrency, formatAdminDate, LoadingState, PageHeading, StatCard, studentName } from "./AdminUI";

export default function AdminDashboardClient() {
  const { result, error, isLoading } = useAdminData("/dashboard");
  return (
    <>
      <PageHeading title="Dashboard" description="A live overview of YouthBiz students and their work." />
      {isLoading && <LoadingState>Loading live database statistics…</LoadingState>}
      {error && <ErrorState>{error}</ErrorState>}
      {result && <>
        <section className="admin-stat-grid" aria-label="YouthBiz totals">
          <StatCard label="Registered students" value={result.stats.totalStudents} detail="All student accounts" />
          <StatCard label="Products created" value={result.stats.totalProducts} detail="Includes archived products" />
          <StatCard label="Available inventory" value={result.stats.totalInventory} detail={result.stats.totalProduced + " produced · " + result.stats.totalSold + " sold"} accent />
          <StatCard label="Business pitches" value={result.stats.totalBusinessPitches} detail={result.stats.lowStockProducts + " active low-stock products"} />
        </section>
        <div className="admin-dashboard-grid">
          <section className="admin-panel">
            <div className="admin-panel-heading"><h2>Recent registrations</h2><Link href="/admin/students">View students</Link></div>
            {result.recentStudents.length ? <div className="admin-record-list">{result.recentStudents.map((student) => <Link href="/admin/students" key={student.id}><span className="admin-avatar">{student.firstName[0]}</span><span><strong>{studentName(student)}</strong><small>{student.email}</small></span><time>{formatAdminDate(student.createdAt)}</time></Link>)}</div> : <EmptyState>No students have registered yet.</EmptyState>}
          </section>
          <section className="admin-panel">
            <div className="admin-panel-heading"><h2>Recent products</h2><Link href="/admin/products">View products</Link></div>
            {result.recentProducts.length ? <div className="admin-record-list">{result.recentProducts.map((product) => <Link href="/admin/products" key={product.id}><span className="admin-list-icon">P</span><span><strong>{product.name}</strong><small>{studentName(product.student)} · {product.category}</small></span><time>{formatAdminDate(product.createdAt)}</time></Link>)}</div> : <EmptyState>No products have been created yet.</EmptyState>}
          </section>
          <section className="admin-panel admin-panel-wide">
            <div className="admin-panel-heading"><h2>Recent business pitches</h2><Link href="/admin/business-pitches">View pitches</Link></div>
            {result.recentPitches.length ? <div className="admin-record-list">{result.recentPitches.map((pitch) => <Link href="/admin/business-pitches" key={pitch.id}><span className="admin-list-icon admin-list-icon-coral">B</span><span><strong>{pitch.businessName}</strong><small>{studentName(pitch.student)} · {pitch.eventLocation}</small></span><span className="admin-record-end"><small>Est. revenue</small><strong>{formatAdminCurrency(pitch.estimatedRevenue)}</strong></span></Link>)}</div> : <EmptyState>No business pitches have been created yet.</EmptyState>}
          </section>
        </div>
      </>}
    </>
  );
}
