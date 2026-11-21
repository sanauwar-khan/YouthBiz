"use client";

import { useState } from "react";
import { useAdminData } from "../_lib/useAdminData";
import { EmptyState, ErrorState, formatAdminCurrency, formatAdminDate, LoadingState, PageHeading, Pagination, studentName } from "./AdminUI";

export default function AdminProductsClient() {
  const [searchText, setSearchText] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState("");
  const path = "/products?page=" + page + "&limit=25&q=" + encodeURIComponent(query) + "&category=" + category + "&status=" + status;
  const list = useAdminData(path);
  const detail = useAdminData(selectedId ? "/products/" + selectedId : null);

  function submit(event) {
    event.preventDefault();
    setPage(1);
    setQuery(searchText.trim());
    setSelectedId("");
  }

  return (
    <>
      <PageHeading title="Products" description="Review products across YouthBiz, with student ownership, pricing, and production data." />
      <form className="admin-filter-bar" onSubmit={submit}>
        <label className="admin-search-field">Search products<input onChange={(event) => setSearchText(event.target.value)} placeholder="Product, student, or email" value={searchText} /></label>
        <label>Category<select onChange={(event) => { setCategory(event.target.value); setPage(1); }} value={category}><option value="all">All categories</option><option value="accessories">Accessories</option><option value="art-crafts">Art &amp; crafts</option><option value="stationery">Stationery</option><option value="home-decor">Home decor</option><option value="other">Other</option></select></label>
        <label>Status<select onChange={(event) => { setStatus(event.target.value); setPage(1); }} value={status}><option value="all">Active and archived</option><option value="active">Active</option><option value="archived">Archived</option></select></label>
        <button className="admin-button admin-button-primary" type="submit">Search</button>
      </form>
      {list.isLoading && <LoadingState>Loading products…</LoadingState>}
      {list.error && <ErrorState>{list.error}</ErrorState>}
      {list.result && (list.result.products.length ? (
        <section className="admin-panel admin-table-panel">
          <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Product</th><th>Student</th><th>Category</th><th>Unit cost</th><th>Selling price</th><th>Produced</th><th>Available</th><th /></tr></thead><tbody>
            {list.result.products.map((product) => <tr key={product.id}><td><strong>{product.name}</strong>{product.isArchived && <span className="admin-status is-archived">Archived</span>}</td><td>{studentName(product.student)}</td><td>{product.category}</td><td>{formatAdminCurrency(product.unitCost)}</td><td>{formatAdminCurrency(product.sellingPrice)}</td><td>{product.totalProduced}</td><td>{product.availableStock}{product.isLowStock && !product.isArchived && <span className="admin-status is-warning">Low</span>}</td><td><button className="admin-link-button" onClick={() => setSelectedId(selectedId === product.id ? "" : product.id)} type="button">{selectedId === product.id ? "Hide" : "Details"}</button></td></tr>)}
          </tbody></table></div>
          <Pagination value={list.result.pagination} onChange={setPage} />
        </section>
      ) : <EmptyState>No products match these filters.</EmptyState>)}
      {selectedId && detail.isLoading && <LoadingState>Loading product details…</LoadingState>}
      {selectedId && detail.error && <ErrorState>{detail.error}</ErrorState>}
      {detail.result && (
        <section className="admin-panel admin-detail-panel">
          <div className="admin-panel-heading"><div><p className="admin-eyebrow">Product details</p><h2>{detail.result.product.name}</h2></div><button aria-label="Close product details" className="admin-icon-button" onClick={() => setSelectedId("")} type="button">×</button></div>
          <div className="admin-detail-meta"><span>Owner: {studentName(detail.result.product.student)}</span><span>{detail.result.product.student?.email}</span><span>Created {formatAdminDate(detail.result.product.createdAt)}</span></div>
          <p>{detail.result.product.description || "No description provided."}</p>
          <div className="admin-stat-grid admin-stat-grid-compact"><StatLine label="Unit cost" value={formatAdminCurrency(detail.result.product.unitCost)} /><StatLine label="Selling price" value={formatAdminCurrency(detail.result.product.sellingPrice)} /><StatLine label="Initial production" value={detail.result.product.initialProductionQuantity} /><StatLine label="Total produced" value={detail.result.product.totalProduced} /></div>
          <h3>Materials</h3>
          {detail.result.product.materials.length ? <ul className="admin-chip-list">{detail.result.product.materials.map((material, index) => <li key={index}>{material.name} · {material.quantity} {material.unit}</li>)}</ul> : <EmptyState>No materials listed.</EmptyState>}
          <h3>Inventory history</h3>
          {detail.result.movements.length ? <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Type</th><th>Quantity</th><th>Unit cost</th><th>Unit price</th><th>Note</th><th>Date</th></tr></thead><tbody>{detail.result.movements.map((movement) => <tr key={movement.id}><td>{movement.type}</td><td>{movement.quantity}</td><td>{movement.unitCost == null ? "—" : formatAdminCurrency(movement.unitCost)}</td><td>{movement.unitPrice == null ? "—" : formatAdminCurrency(movement.unitPrice)}</td><td>{movement.notes || "—"}</td><td>{formatAdminDate(movement.createdAt)}</td></tr>)}</tbody></table></div> : <EmptyState>No stock history.</EmptyState>}
        </section>
      )}
    </>
  );
}

function StatLine({ label, value }) {
  return <div className="admin-stat-card admin-stat-line"><span>{label}</span><strong>{value}</strong></div>;
}
