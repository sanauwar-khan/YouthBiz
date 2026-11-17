"use client";

import { useState } from "react";
import { dashboardRequest } from "../_lib/dashboardApi";

const categories = [
  ["accessories", "Accessories"],
  ["art-crafts", "Art & crafts"],
  ["stationery", "Stationery"],
  ["home-decor", "Home decor"],
  ["other", "Other"],
];

function emptyProduct() {
  return {
    name: "",
    description: "",
    category: "other",
    materials: [],
    unitCost: "",
    sellingPrice: "",
    initialProductionQuantity: "0",
  };
}

function ProductFields({ value, onChange, includeInitialQuantity }) {
  function update(field, fieldValue) {
    onChange({ ...value, [field]: fieldValue });
  }

  function updateMaterial(index, field, fieldValue) {
    const materials = value.materials.map((material, materialIndex) => (
      materialIndex === index ? { ...material, [field]: fieldValue } : material
    ));
    update("materials", materials);
  }

  function addMaterial() {
    update("materials", [...value.materials, { name: "", quantity: "", unit: "" }]);
  }

  function removeMaterial(index) {
    update("materials", value.materials.filter((_material, materialIndex) => materialIndex !== index));
  }

  return (
    <>
      <label>Product name<input autoComplete="off" maxLength={100} onChange={(event) => update("name", event.target.value)} placeholder="e.g. Handmade bookmarks" required value={value.name} /></label>
      <label>Description<textarea maxLength={1200} onChange={(event) => update("description", event.target.value)} placeholder="Describe your product" rows={2} value={value.description} /></label>
      <label>Category<select onChange={(event) => update("category", event.target.value)} value={value.category}>{categories.map(([category, label]) => <option key={category} value={category}>{label}</option>)}</select></label>

      <fieldset className="product-materials-fieldset">
        <legend>Materials required</legend>
        {value.materials.length === 0 && <span className="product-form-hint">Add the materials you use to make one unit.</span>}
        {value.materials.map((material, index) => (
          <div className="product-material-row" key={index}>
            <label>Material<input maxLength={80} onChange={(event) => updateMaterial(index, "name", event.target.value)} placeholder="Cardstock" required value={material.name} /></label>
            <label>Quantity<input min="0.01" onChange={(event) => updateMaterial(index, "quantity", event.target.value)} required step="0.01" type="number" value={material.quantity} /></label>
            <label>Unit<input maxLength={30} onChange={(event) => updateMaterial(index, "unit", event.target.value)} placeholder="sheets" required value={material.unit} /></label>
            <button aria-label={`Remove material ${index + 1}`} className="dashboard-text-button danger-text" onClick={() => removeMaterial(index)} type="button">Remove</button>
          </div>
        ))}
        <button className="dashboard-text-button product-add-material" onClick={addMaterial} type="button">+ Add material</button>
      </fieldset>

      <div className="product-cost-row">
        <label>Production cost per unit ($)<input inputMode="decimal" min="0" onChange={(event) => update("unitCost", event.target.value)} required step="0.01" type="number" value={value.unitCost} /></label>
        <label>Selling price per unit ($)<input inputMode="decimal" min="0" onChange={(event) => update("sellingPrice", event.target.value)} required step="0.01" type="number" value={value.sellingPrice} /></label>
      </div>

      {includeInitialQuantity && <label>Initial production quantity<input min="0" onChange={(event) => update("initialProductionQuantity", event.target.value)} required step="1" type="number" value={value.initialProductionQuantity} /></label>}
    </>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
}

export default function ProductSection({ products, isSaving, onAction }) {
  const [draft, setDraft] = useState(emptyProduct);
  const [editing, setEditing] = useState(null);

  async function createProduct(event) {
    event.preventDefault();
    const body = {
      ...draft,
      unitCost: Number(draft.unitCost),
      sellingPrice: Number(draft.sellingPrice),
      initialProductionQuantity: Number(draft.initialProductionQuantity),
      materials: draft.materials.map((material) => ({ ...material, quantity: Number(material.quantity) })),
    };
    if (await onAction(() => dashboardRequest("/products", { method: "POST", body }))) {
      setDraft(emptyProduct());
    }
  }

  async function updateProduct(event) {
    event.preventDefault();
    const body = {
      name: editing.name,
      description: editing.description,
      category: editing.category,
      materials: editing.materials.map((material) => ({ ...material, quantity: Number(material.quantity) })),
      unitCost: Number(editing.unitCost),
      sellingPrice: Number(editing.sellingPrice),
    };
    if (await onAction(() => dashboardRequest(`/products/${editing.id}`, { method: "PATCH", body }))) {
      setEditing(null);
    }
  }

  async function archiveProduct(productId) {
    await onAction(() => dashboardRequest(`/products/${productId}/archive`, { method: "PATCH", body: {} }));
  }

  return (
    <section className="dashboard-feature" id="products" aria-labelledby="products-heading">
      <div className="dashboard-feature-heading">
        <div><p className="eyebrow">Design it</p><h2 id="products-heading">My Products</h2></div>
        <span className="dashboard-count">{products.length} active {products.length === 1 ? "product" : "products"}</span>
      </div>
      <div className="dashboard-feature-grid">
        <form className="dashboard-form" onSubmit={createProduct}>
          <h3>Create a product</h3>
          <ProductFields includeInitialQuantity onChange={setDraft} value={draft} />
          <button className="button button-dark" disabled={isSaving} type="submit">{isSaving ? "Saving..." : "Add product"}</button>
        </form>
        <div className="dashboard-list" aria-live="polite">
          {products.length === 0 ? <p className="student-empty-state">Create your first product. You can add materials, set a price, and start its inventory here.</p> : products.map((product) => (
            <article className="dashboard-list-item product-list-item" key={product.id}>
              {editing?.id === product.id ? (
                <form className="dashboard-inline-form" onSubmit={updateProduct}>
                  <ProductFields onChange={setEditing} value={editing} />
                  <p className="product-form-hint">Initial production is recorded once; use Inventory Management to add more stock.</p>
                  <div className="dashboard-item-actions"><button className="dashboard-text-button" disabled={isSaving} type="submit">Save changes</button><button className="dashboard-text-button" onClick={() => setEditing(null)} type="button">Cancel</button></div>
                </form>
              ) : (
                <>
                  <div className="product-list-main">
                    <span className="transaction-type">{categories.find(([category]) => category === product.category)?.[1] || "Product"}</span>
                    <h3>{product.name}</h3>
                    <p>{product.description || "No description yet."}</p>
                    <div className="product-economics"><span>Cost <strong>{formatCurrency(product.unitCost)}</strong></span><span>Price <strong>{formatCurrency(product.sellingPrice)}</strong></span><span>Stock <strong>{product.availableStock}</strong></span></div>
                    <small>{product.materials.length ? `${product.materials.length} material${product.materials.length === 1 ? "" : "s"}` : "No materials listed"} · {product.totalProduced} produced initially</small>
                  </div>
                  <div className="dashboard-item-actions"><button className="dashboard-text-button" onClick={() => setEditing({ ...product, id: product.id, initialProductionQuantity: String(product.initialProductionQuantity), unitCost: String(product.unitCost), sellingPrice: String(product.sellingPrice), materials: product.materials.map((material) => ({ ...material, quantity: String(material.quantity) })) })} type="button">Edit</button><button className="dashboard-text-button danger-text" disabled={isSaving} onClick={() => archiveProduct(product.id)} type="button">Archive</button></div>
                </>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}