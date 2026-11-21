"use client";

import { useState } from "react";
import { useAdminData } from "../_lib/useAdminData";
import { EmptyState, ErrorState, LoadingState, PageHeading, Pagination, studentName, formatAdminDate } from "./AdminUI";

export default function AdminInventoryClient() {
  const [searchText, setSearchText] = useState("");
  const [query, setQuery] = useState("");
  const [lowStock, setLowStock] = useState(false);
  const [status, setStatus] = useState("active");
  const [studentId, setStudentId] = useState("");
  const [productId, setProductId] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState("");
  const students = useAdminData("/students?limit=100");
  const productOptions = useAdminData("/inventory?limit=100&status=active");
  const path = "/inventory?page=" + page + "&limit=25&q=" + encodeURIComponent(query) + "&status=" + status + "&lowStock=" + lowStock + "&studentId=" + encodeURIComponent(studentId) + "&productId=" + encodeURIComponent(productId);
  const list = useAdminData(path);
  const detail = useAdminData(selectedId ? "/inventory/" + selectedId + "/movements" : null);

  function submit(event) {
    event.preventDefault();
    setPage(1);
    setQuery(searchText.trim());
    setSelectedId("");
  }

  return (
    <>
      <PageHeading title="Inventory" description="Monitor available stock and movement history across student products." />
      <form className="admin-filter-bar admin-filter-bar-wrap" onSubmit={submit}>
        <label className="admin-search-field">Search<input onChange={(event) => setSearchText(event.target.value)} placeholder="Product, student, or email" value={searchText} /></label>
        <label>Student<select onChange={(event) => { setStudentId(event.target.value); setPage(1); }} value={studentId}><option value="">All students</option>{students.result?.students.map((student) => <option key={student.id} value={student.id}>{studentName(student)}</option>)}</select></label>
        <label>Product<select onChange={(event) => { setProductId(event.target.value); setPage(1); }} value={productId}><option value="">All products</option>{productOptions.result?.products.map((product) => <option key={product.id} value={product.id}>{product.name} · {studentName(product.student)}</option>)}</select></label>
        <label>Stock status<select onChange={(event) => { setLowStock(event.target.value === "low"); setPage(1); }} value={lowStock ? "low" : "any"}><option value="any">Any stock</option><option value="low">Low stock (5 or less)</option></select></label>
        <label>Products<select onChange={(event) => { setStatus(event.target.value); setPage(1); }} value={status}><option value="active">Active only</option><option value="archived">Archived only</option><option value="all">All</option></select></label>
        <button className="admin-button admin-button-primary" type="submit">Search</button>
      </form>
      {list.isLoading && <LoadingState>Loading inventory…</LoadingState>}
      {list.error && <ErrorState>{list.error}</ErrorState>}
      {list.result && (list.result.products.length ? (
        <section className="admin-panel admin-table-panel">
          <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Product</th><th>Student</th><th>Produced</th><th>Sold</th><th>Available</th><th>Stock health</th><th /></tr></thead><tbody>
            {list.result.products.map((product) => <tr key={product.id}><td><strong>{product.name}</strong>{product.isArchived && <span className="admin-status is-archived">Archived</span>}</td><td>{studentName(product.student)}</td><td>{product.totalProduced}</td><td>{product.totalSold}</td><td>{product.availableStock}</td><td><span className={"admin-status " + (product.isLowStock && !product.isArchived ? "is-warning" : "is-healthy")}>{product.isLowStock && !product.isArchived ? "Low stock" : "Healthy"}</span></td><td><button className="admin-link-button" onClick={() => setSelectedId(selectedId === product.id ? "" : product.id)} type="button">{selectedId === product.id ? "Hide history" : "History"}</button></td></tr>)}
          </tbody></table></div>
          <Pagination value={list.result.pagination} onChange={setPage} />
        </section>
      ) : <EmptyState>No inventory matches these filters.</EmptyState>)}
      {selectedId && detail.isLoading && <LoadingState>Loading stock history…</LoadingState>}
      {selectedId && detail.error && <ErrorState>{detail.error}</ErrorState>}
      {detail.result && (
        <section className="admin-panel admin-detail-panel">
          <div className="admin-panel-heading"><div><p className="admin-eyebrow">Stock history</p><h2>{detail.result.product.name}</h2></div><button aria-label="Close inventory history" className="admin-icon-button" onClick={() => setSelectedId("")} type="button">×</button></div>
          <p>Owner: {studentName(detail.result.product.student)} · {detail.result.product.availableStock} currently available</p>
          {detail.result.movements.length ? <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Movement</th><th>Quantity</th><th>Unit cost</th><th>Unit price</th><th>Note</th><th>Date</th></tr></thead><tbody>{detail.result.movements.map((movement) => <tr key={movement.id}><td>{movement.type}</td><td>{movement.quantity}</td><td>{movement.unitCost == null ? "—" : movement.unitCost.toFixed(2)}</td><td>{movement.unitPrice == null ? "—" : movement.unitPrice.toFixed(2)}</td><td>{movement.notes || "—"}</td><td>{formatAdminDate(movement.createdAt)}</td></tr>)}</tbody></table></div> : <EmptyState>No stock movements found.</EmptyState>}
        </section>
      )}
    </>
  );
}
