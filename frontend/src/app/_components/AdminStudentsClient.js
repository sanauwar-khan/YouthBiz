"use client";

import { useState } from "react";
import { useAdminData } from "../_lib/useAdminData";
import { EmptyState, ErrorState, formatAdminDate, LoadingState, PageHeading, Pagination, studentName } from "./AdminUI";

export default function AdminStudentsClient() {
  const [searchText, setSearchText] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState("");
  const path = "/students?page=" + page + "&limit=25&q=" + encodeURIComponent(query);
  const list = useAdminData(path);
  const detail = useAdminData(selectedId ? "/students/" + selectedId : null);

  function search(event) {
    event.preventDefault();
    setPage(1);
    setQuery(searchText.trim());
    setSelectedId("");
  }

  return (
    <>
      <PageHeading title="Students" description="Search student accounts and review their products, inventory history, and pitches." />
      <form className="admin-filter-bar" onSubmit={search}>
        <label className="admin-search-field">Search students<input onChange={(event) => setSearchText(event.target.value)} placeholder="Name or email address" value={searchText} /></label>
        <button className="admin-button admin-button-primary" type="submit">Search</button>
        {query && <button className="admin-button admin-button-secondary" onClick={() => { setSearchText(""); setQuery(""); setPage(1); }} type="button">Clear</button>}
      </form>
      {list.isLoading && <LoadingState>Loading student records…</LoadingState>}
      {list.error && <ErrorState>{list.error}</ErrorState>}
      {list.result && (list.result.students.length ? (
        <section className="admin-panel admin-table-panel">
          <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Student</th><th>Email</th><th>Age group</th><th>Registered</th><th /></tr></thead><tbody>
            {list.result.students.map((student) => <tr key={student.id}><td><strong>{studentName(student)}</strong></td><td>{student.email}</td><td>{student.ageGroup}</td><td>{formatAdminDate(student.createdAt)}</td><td><button className="admin-link-button" onClick={() => setSelectedId(selectedId === student.id ? "" : student.id)} type="button">{selectedId === student.id ? "Hide details" : "View details"}</button></td></tr>)}
          </tbody></table></div>
          <Pagination value={list.result.pagination} onChange={setPage} />
        </section>
      ) : <EmptyState>No students match this search.</EmptyState>)}

      {selectedId && detail.isLoading && <LoadingState>Loading student details…</LoadingState>}
      {selectedId && detail.error && <ErrorState>{detail.error}</ErrorState>}
      {detail.result && (
        <section className="admin-panel admin-detail-panel">
          <div className="admin-panel-heading"><div><p className="admin-eyebrow">Student details</p><h2>{studentName(detail.result.student)}</h2></div><button aria-label="Close student details" className="admin-icon-button" onClick={() => setSelectedId("")} type="button">×</button></div>
          <div className="admin-detail-meta"><span>{detail.result.student.email}</span><span>{detail.result.student.ageGroup}</span><span>Registered {formatAdminDate(detail.result.student.createdAt)}</span></div>
          <h3>Products and inventory</h3>
          {detail.result.products.length ? <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Product</th><th>Cost</th><th>Price</th><th>Produced</th><th>Sold</th><th>Available</th></tr></thead><tbody>{detail.result.products.map((product) => <tr key={product.id}><td>{product.name}{product.isArchived && <span className="admin-status is-archived">Archived</span>}</td><td>{product.unitCost.toFixed(2)}</td><td>{product.sellingPrice.toFixed(2)}</td><td>{product.totalProduced}</td><td>{product.totalSold}</td><td>{product.availableStock}</td></tr>)}</tbody></table></div> : <EmptyState>This student has no products.</EmptyState>}
          <h3>Recent inventory history</h3>
          {detail.result.inventoryHistory.length ? <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Movement</th><th>Quantity</th><th>Note</th><th>Date</th></tr></thead><tbody>{detail.result.inventoryHistory.map((item) => <tr key={item.id}><td>{item.type}</td><td>{item.quantity}</td><td>{item.notes || "—"}</td><td>{formatAdminDate(item.createdAt)}</td></tr>)}</tbody></table></div> : <EmptyState>No inventory movements.</EmptyState>}
          <h3>Business pitches</h3>
          {detail.result.pitches.length ? <div className="admin-record-list">{detail.result.pitches.map((pitch) => <article key={pitch.id}><span className="admin-list-icon admin-list-icon-coral">B</span><span><strong>{pitch.businessName}</strong><small>{pitch.eventLocation} · {formatAdminDate(pitch.eventDate)}</small></span><span className="admin-record-end"><small>Estimated profit</small><strong>{pitch.estimatedProfit.toFixed(2)}</strong></span></article>)}</div> : <EmptyState>No business pitches.</EmptyState>}
        </section>
      )}
    </>
  );
}
