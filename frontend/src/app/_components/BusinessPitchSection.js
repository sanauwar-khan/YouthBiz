"use client";

import { useState } from "react";
import { dashboardRequest } from "../_lib/dashboardApi";

function emptyPitch() {
  return {
    businessName: "",
    description: "",
    products: [],
    targetCustomers: "",
    uniqueValue: "",
    eventDate: "",
    eventLocation: "",
  };
}

function dateInputValue(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateLabel(value) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
}

function estimate(lines, products) {
  return lines.reduce((totals, line) => {
    const product = products.find((item) => item.id === line.productId);
    const unitCost = product?.unitCost ?? line.unitCostSnapshot ?? 0;
    const price = Number(line.proposedPrice) || 0;
    const quantity = Number(line.expectedQuantity) || 0;
    totals.revenue += price * quantity;
    totals.costs += unitCost * quantity;
    return totals;
  }, { revenue: 0, costs: 0 });
}

function PitchFields({ value, onChange, products }) {
  const estimates = estimate(value.products, products);

  function updateField(field, fieldValue) {
    onChange({ ...value, [field]: fieldValue });
  }

  function toggleProduct(product, checked) {
    const lines = checked
      ? [...value.products, {
          productId: product.id,
          productName: product.name,
          unitCostSnapshot: product.unitCost,
          proposedPrice: String(product.sellingPrice),
          expectedQuantity: "1",
        }]
      : value.products.filter((line) => line.productId !== product.id);
    updateField("products", lines);
  }

  function updateLine(productId, field, fieldValue) {
    updateField("products", value.products.map((line) => (
      line.productId === productId ? { ...line, [field]: fieldValue } : line
    )));
  }

  function removeLine(productId) {
    updateField("products", value.products.filter((line) => line.productId !== productId));
  }

  return (
    <>
      <label>Business name<input maxLength={100} onChange={(event) => updateField("businessName", event.target.value)} placeholder="e.g. Nora’s Paper Studio" required value={value.businessName} /></label>
      <label>Business description<textarea maxLength={2000} onChange={(event) => updateField("description", event.target.value)} placeholder="What does your business make or offer?" required rows={3} value={value.description} /></label>

      <fieldset className="pitch-product-picker">
        <legend>Products for this pitch</legend>
        {products.length === 0 && value.products.length === 0
          ? <span className="product-form-hint">Create a product in My Products before adding it to a pitch.</span>
          : <div className="pitch-product-options">{products.map((product) => (
            <label className="pitch-product-option" key={product.id}>
              <input checked={value.products.some((line) => line.productId === product.id)} onChange={(event) => toggleProduct(product, event.target.checked)} type="checkbox" />
              <span>{product.name}</span>
            </label>
          ))}</div>}
      </fieldset>

      {value.products.length > 0 && <div className="pitch-line-editor">
        {value.products.map((line) => {
          const product = products.find((item) => item.id === line.productId);
          return (
            <div className="pitch-line-row" key={line.productId}>
              <div className="pitch-line-name"><strong>{product?.name || line.productName}</strong>{!product && <small>Saved product snapshot</small>}</div>
              <label>Price ($)<input inputMode="decimal" min="0" onChange={(event) => updateLine(line.productId, "proposedPrice", event.target.value)} required step="0.01" type="number" value={line.proposedPrice} /></label>
              <label>Expected qty<input min="1" onChange={(event) => updateLine(line.productId, "expectedQuantity", event.target.value)} required step="1" type="number" value={line.expectedQuantity} /></label>
              <button aria-label={`Remove ${product?.name || line.productName} from pitch`} className="dashboard-text-button danger-text" onClick={() => removeLine(line.productId)} type="button">Remove</button>
            </div>
          );
        })}
      </div>}

      <label>Target customers<input maxLength={600} onChange={(event) => updateField("targetCustomers", event.target.value)} placeholder="Who would enjoy your product?" required value={value.targetCustomers} /></label>
      <label>What makes your business unique?<textarea maxLength={1000} onChange={(event) => updateField("uniqueValue", event.target.value)} placeholder="What makes your idea special?" required rows={2} value={value.uniqueValue} /></label>
      <div className="pitch-event-row">
        <label>Proposed event date<input min={new Date().toISOString().slice(0, 10)} onChange={(event) => updateField("eventDate", event.target.value)} required type="date" value={value.eventDate} /></label>
        <label>Proposed location<input maxLength={200} onChange={(event) => updateField("eventLocation", event.target.value)} placeholder="e.g. School fair" required value={value.eventLocation} /></label>
      </div>

      <div className="pitch-estimate-preview" aria-live="polite">
        <span><small>Estimated revenue</small><strong>{formatCurrency(estimates.revenue)}</strong></span>
        <span><small>Estimated costs</small><strong>{formatCurrency(estimates.costs)}</strong></span>
        <span><small>Estimated profit</small><strong className={estimates.revenue - estimates.costs < 0 ? "negative-value" : "positive-value"}>{formatCurrency(estimates.revenue - estimates.costs)}</strong></span>
      </div>
    </>
  );
}

export default function BusinessPitchSection({ pitches, products, isSaving, onAction }) {
  const [draft, setDraft] = useState(emptyPitch);
  const [editing, setEditing] = useState(null);

  function requestBody(value) {
    return {
      businessName: value.businessName,
      description: value.description,
      products: value.products.map((line) => ({
        productId: line.productId,
        proposedPrice: Number(line.proposedPrice),
        expectedQuantity: Number(line.expectedQuantity),
      })),
      targetCustomers: value.targetCustomers,
      uniqueValue: value.uniqueValue,
      eventDate: new Date(`${value.eventDate}T12:00:00`).toISOString(),
      eventLocation: value.eventLocation,
    };
  }

  async function createPitch(event) {
    event.preventDefault();
    if (!draft.products.length) return;
    if (await onAction(() => dashboardRequest("/pitches", { method: "POST", body: requestBody(draft) }))) {
      setDraft(emptyPitch());
    }
  }

  async function updatePitch(event) {
    event.preventDefault();
    if (!editing.products.length) return;
    if (await onAction(() => dashboardRequest(`/pitches/${editing.id}`, { method: "PATCH", body: requestBody(editing) }))) {
      setEditing(null);
    }
  }

  async function archivePitch(pitchId) {
    await onAction(() => dashboardRequest(`/pitches/${pitchId}/archive`, { method: "PATCH", body: {} }));
  }

  return (
    <section className="dashboard-feature" id="pitches" aria-labelledby="pitches-heading">
      <div className="dashboard-feature-heading">
        <div><p className="eyebrow">Share your plan</p><h2 id="pitches-heading">Business Pitch &amp; Pop-up</h2></div>
        <span className="dashboard-count">Planned events · not bookings</span>
      </div>
      <div className="dashboard-feature-grid">
        <form className="dashboard-form" onSubmit={createPitch}>
          <h3>Create a business pitch</h3>
          <PitchFields onChange={setDraft} products={products} value={draft} />
          <button className="button button-dark" disabled={isSaving || draft.products.length === 0} type="submit">{isSaving ? "Saving..." : "Save proposed pitch"}</button>
        </form>

        <div className="dashboard-list pitch-list" aria-live="polite">
          {pitches.length === 0 ? <p className="student-empty-state">Your saved pitches will appear here. A proposed pop-up is a plan, not a confirmed event.</p> : pitches.map((pitch) => (
            <article className="business-pitch-card" key={pitch.id}>
              {editing?.id === pitch.id ? (
                <form className="dashboard-inline-form" onSubmit={updatePitch}>
                  <PitchFields onChange={setEditing} products={products} value={editing} />
                  <div className="dashboard-item-actions"><button className="dashboard-text-button" disabled={isSaving || editing.products.length === 0} type="submit">Save changes</button><button className="dashboard-text-button" onClick={() => setEditing(null)} type="button">Cancel</button></div>
                </form>
              ) : (
                <>
                  <div className="business-pitch-card-header"><span className="proposed-event-status">Proposed pop-up</span><span className="business-pitch-date">{dateLabel(pitch.eventDate)}</span></div>
                  <h3>{pitch.businessName}</h3>
                  <p className="business-pitch-description">{pitch.description}</p>
                  <div className="business-pitch-lines">{pitch.products.map((line) => <div key={line.productId}><span>{line.productName} · {line.expectedQuantity} expected</span><strong>{formatCurrency(line.proposedPrice)} each</strong></div>)}</div>
                  <div className="business-pitch-preview-grid"><div><small>Target customers</small><p>{pitch.targetCustomers}</p></div><div><small>Why it’s unique</small><p>{pitch.uniqueValue}</p></div><div><small>Planned location</small><p>{pitch.eventLocation}</p></div></div>
                  <div className="pitch-estimate-preview pitch-card-estimates"><span><small>Est. revenue</small><strong>{formatCurrency(pitch.estimatedRevenue)}</strong></span><span><small>Est. costs</small><strong>{formatCurrency(pitch.estimatedCosts)}</strong></span><span><small>Est. profit</small><strong className={pitch.estimatedProfit < 0 ? "negative-value" : "positive-value"}>{formatCurrency(pitch.estimatedProfit)}</strong></span></div>
                  <p className="pitch-proposed-note">This is a proposed event, not a confirmed booking.</p>
                  <div className="dashboard-item-actions"><button className="dashboard-text-button" onClick={() => setEditing({ ...pitch, id: pitch.id, eventDate: dateInputValue(pitch.eventDate), products: pitch.products.map((line) => ({ ...line, proposedPrice: String(line.proposedPrice), expectedQuantity: String(line.expectedQuantity) })) })} type="button">Edit pitch</button><button className="dashboard-text-button danger-text" disabled={isSaving} onClick={() => archivePitch(pitch.id)} type="button">Archive</button></div>
                </>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}