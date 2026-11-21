"use client";

import { useState } from "react";
import { useAdminData } from "../_lib/useAdminData";
import { EmptyState, ErrorState, formatAdminCurrency, formatAdminDate, LoadingState, PageHeading, Pagination, studentName } from "./AdminUI";

export default function AdminPitchesClient() {
  const [searchText, setSearchText] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("active");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState("");
  const path = "/business-pitches?page=" + page + "&limit=25&q=" + encodeURIComponent(query) + "&status=" + status;
  const list = useAdminData(path);
  const detail = useAdminData(selectedId ? "/business-pitches/" + selectedId : null);

  function submit(event) {
    event.preventDefault();
    setPage(1);
    setQuery(searchText.trim());
    setSelectedId("");
  }

  return (
    <>
      <PageHeading title="Business Pitches" description="Review student pitch plans, proposed pop-up details, product lines, and financial estimates." />
      <form className="admin-filter-bar" onSubmit={submit}>
        <label className="admin-search-field">Search pitches<input onChange={(event) => setSearchText(event.target.value)} placeholder="Business, student, customers, location" value={searchText} /></label>
        <label>Status<select onChange={(event) => { setStatus(event.target.value); setPage(1); }} value={status}><option value="active">Active pitches</option><option value="archived">Archived</option><option value="all">All pitches</option></select></label>
        <button className="admin-button admin-button-primary" type="submit">Search</button>
      </form>
      {list.isLoading && <LoadingState>Loading business pitches…</LoadingState>}
      {list.error && <ErrorState>{list.error}</ErrorState>}
      {list.result && (list.result.pitches.length ? (
        <section className="admin-panel admin-table-panel">
          <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Business</th><th>Student</th><th>Proposed date</th><th>Location</th><th>Est. revenue</th><th>Est. profit</th><th /></tr></thead><tbody>
            {list.result.pitches.map((pitch) => <tr key={pitch.id}><td><strong>{pitch.businessName}</strong>{pitch.isArchived && <span className="admin-status is-archived">Archived</span>}</td><td>{studentName(pitch.student)}</td><td>{formatAdminDate(pitch.eventDate)}</td><td>{pitch.eventLocation}</td><td>{formatAdminCurrency(pitch.estimatedRevenue)}</td><td>{formatAdminCurrency(pitch.estimatedProfit)}</td><td><button className="admin-link-button" onClick={() => setSelectedId(selectedId === pitch.id ? "" : pitch.id)} type="button">{selectedId === pitch.id ? "Hide" : "Details"}</button></td></tr>)}
          </tbody></table></div>
          <Pagination value={list.result.pagination} onChange={setPage} />
        </section>
      ) : <EmptyState>No pitches match these filters.</EmptyState>)}
      {selectedId && detail.isLoading && <LoadingState>Loading pitch details…</LoadingState>}
      {selectedId && detail.error && <ErrorState>{detail.error}</ErrorState>}
      {detail.result && (
        <section className="admin-panel admin-detail-panel">
          <div className="admin-panel-heading"><div><p className="admin-eyebrow">Pitch details</p><h2>{detail.result.pitch.businessName}</h2></div><button aria-label="Close pitch details" className="admin-icon-button" onClick={() => setSelectedId("")} type="button">×</button></div>
          <div className="admin-detail-meta"><span>Student: {studentName(detail.result.pitch.student)}</span><span>{detail.result.pitch.student?.email}</span><span>Event status: proposed</span></div>
          <p>{detail.result.pitch.description}</p>
          <div className="admin-pitch-detail-grid"><div><small>Target customers</small><p>{detail.result.pitch.targetCustomers}</p></div><div><small>What makes it unique</small><p>{detail.result.pitch.uniqueValue}</p></div><div><small>Proposed location</small><p>{detail.result.pitch.eventLocation}</p></div><div><small>Proposed date</small><p>{formatAdminDate(detail.result.pitch.eventDate)}</p></div></div>
          <h3>Associated products</h3>
          <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Product</th><th>Proposed price</th><th>Expected quantity</th><th>Cost snapshot</th></tr></thead><tbody>{detail.result.pitch.products.map((line) => <tr key={line.productId}><td>{line.productName}</td><td>{formatAdminCurrency(line.proposedPrice)}</td><td>{line.expectedQuantity}</td><td>{formatAdminCurrency(line.unitCostSnapshot)}</td></tr>)}</tbody></table></div>
          <div className="admin-stat-grid admin-stat-grid-compact"><div className="admin-stat-card admin-stat-line"><span>Estimated revenue</span><strong>{formatAdminCurrency(detail.result.pitch.estimatedRevenue)}</strong></div><div className="admin-stat-card admin-stat-line"><span>Estimated costs</span><strong>{formatAdminCurrency(detail.result.pitch.estimatedCosts)}</strong></div><div className="admin-stat-card admin-stat-line"><span>Estimated profit</span><strong>{formatAdminCurrency(detail.result.pitch.estimatedProfit)}</strong></div></div>
        </section>
      )}
    </>
  );
}
