"use client";

import { useEffect, useState } from "react";
import { dashboardRequest } from "../_lib/dashboardApi";

function dateLabel(value) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function InventorySection({ products, isSaving, onAction }) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [movement, setMovement] = useState({ type: "production", quantity: "", notes: "" });
  const [historyState, setHistoryState] = useState({ productId: "", movements: [], error: "" });
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const productId = products.some((product) => product.id === selectedProductId)
    ? selectedProductId
    : products[0]?.id || "";
  const selectedProduct = products.find((product) => product.id === productId);

  useEffect(() => {
    if (!productId) return undefined;
    const controller = new AbortController();

    async function loadHistory() {
      try {
        const result = await dashboardRequest(`/inventory/${productId}/movements`, { signal: controller.signal });
        setHistoryState({ productId, movements: result.movements, error: "" });
      } catch (error) {
        if (error.name !== "AbortError") {
          setHistoryState({ productId, movements: [], error: error.message || "Inventory history could not be loaded." });
        }
      }
    }

    loadHistory();
    return () => controller.abort();
  }, [productId, historyRefreshKey]);

  const isLoadingHistory = Boolean(productId && historyState.productId !== productId);
  const historyError = historyState.productId === productId ? historyState.error : "";
  const history = historyState.productId === productId ? historyState.movements : [];

  async function recordMovement(event) {
    event.preventDefault();
    if (!selectedProduct) return;
    const endpoint = movement.type === "sale"
      ? `/inventory/${productId}/sales`
      : `/inventory/${productId}/production`;
    const saved = await onAction(() => dashboardRequest(endpoint, {
      method: "POST",
      body: { quantity: Number(movement.quantity), notes: movement.notes },
    }));
    if (saved) {
      setMovement({ ...movement, quantity: "", notes: "" });
      setHistoryRefreshKey((key) => key + 1);
    }
  }

  return (
    <section className="dashboard-feature" id="inventory" aria-labelledby="inventory-heading">
      <div className="dashboard-feature-heading">
        <div><p className="eyebrow">Know what’s on hand</p><h2 id="inventory-heading">Inventory Management</h2></div>
        <span className="dashboard-count">Available = produced − sold</span>
      </div>

      {products.length === 0 ? (
        <p className="student-empty-state">Create a product in <a className="dashboard-inline-link" href="#products">My Products</a> to start tracking stock.</p>
      ) : (
        <>
          <div className="inventory-product-grid" aria-live="polite">
            {products.map((product) => (
              <article className={`inventory-product-card ${product.id === productId ? "is-selected" : ""}`} key={product.id}>
                <div className="inventory-product-card-heading"><h3>{product.name}</h3>{product.isLowStock && <span className="inventory-low-stock">Low stock</span>}</div>
                <div className="inventory-counts"><span>Produced<strong>{product.totalProduced}</strong></span><span>Sold<strong>{product.totalSold}</strong></span><span>Available<strong>{product.availableStock}</strong></span></div>
                <button aria-pressed={product.id === productId} className="dashboard-text-button" onClick={() => setSelectedProductId(product.id)} type="button">{product.id === productId ? "Viewing history" : "View history"}</button>
              </article>
            ))}
          </div>

          <div className="inventory-workspace">
            <form className="dashboard-form inventory-movement-form" onSubmit={recordMovement}>
              <h3>Record stock movement</h3>
              <label>Product<select onChange={(event) => setProductId(event.target.value)} required value={productId}>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.availableStock} available</option>)}</select></label>
              <label>Movement type<select onChange={(event) => setMovement({ ...movement, type: event.target.value })} value={movement.type}><option value="production">New production</option><option value="sale">Product sale</option></select></label>
              <label>Quantity<input max={movement.type === "sale" ? selectedProduct?.availableStock ?? 0 : 1000000} min="1" onChange={(event) => setMovement({ ...movement, quantity: event.target.value })} required step="1" type="number" value={movement.quantity} /></label>
              {movement.type === "sale" && selectedProduct && <span className="product-form-hint">Maximum sale quantity: {selectedProduct.availableStock}</span>}
              <label>Note (optional)<input maxLength={300} onChange={(event) => setMovement({ ...movement, notes: event.target.value })} placeholder={movement.type === "sale" ? "e.g. Weekend market" : "e.g. Second batch"} value={movement.notes} /></label>
              <button className="button button-dark" disabled={isSaving || !selectedProduct} type="submit">{isSaving ? "Saving..." : movement.type === "sale" ? "Record sale" : "Record production"}</button>
            </form>

            <div className="inventory-history" aria-live="polite">
              <div className="inventory-history-heading"><h3>{selectedProduct ? `${selectedProduct.name} history` : "Inventory history"}</h3>{selectedProduct && <span>{selectedProduct.availableStock} in stock</span>}</div>
              {historyError ? <p className="dashboard-action-error" role="alert">{historyError}</p>
                : isLoadingHistory ? <p className="student-empty-state">Loading inventory history...</p>
                  : history.length === 0 ? <p className="student-empty-state">No stock movements yet.</p>
                    : <div className="dashboard-list">{history.map((item) => (
                      <article className="dashboard-list-item inventory-history-item" key={item.id}>
                        <div><span className={`transaction-type ${item.type === "sale" ? "expense" : "income"}`}>{item.type === "sale" ? "Sale" : "Production"}</span><h3>{item.notes || (item.type === "sale" ? "Product sale" : "Production batch")}</h3><small>{dateLabel(item.createdAt)}</small></div>
                        <strong className={item.type === "sale" ? "negative-value" : "positive-value"}>{item.type === "sale" ? "−" : "+"}{item.quantity} units</strong>
                      </article>
                    ))}</div>}
            </div>
          </div>
        </>
      )}
    </section>
  );
}