export function PageHeading({ eyebrow = "Admin workspace", title, description, actions }) {
  return (
    <div className="admin-page-heading">
      <div><p className="admin-eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p>{description}</p>}</div>
      {actions && <div className="admin-heading-actions">{actions}</div>}
    </div>
  );
}

export function LoadingState({ children = "Loading…" }) {
  return <div className="admin-state admin-loading-state" aria-live="polite">{children}</div>;
}

export function ErrorState({ children }) {
  return <div className="admin-state admin-error-state" role="alert">{children}</div>;
}

export function EmptyState({ children }) {
  return <div className="admin-state admin-empty-state">{children}</div>;
}

export function StatCard({ label, value, detail, accent = false }) {
  return <article className={`admin-stat-card ${accent ? "is-accent" : ""}`}><span>{label}</span><strong>{value ?? "—"}</strong>{detail && <small>{detail}</small>}</article>;
}

export function Pagination({ value, onChange }) {
  if (!value || value.pages <= 1) return null;
  return (
    <div className="admin-pagination">
      <span>Page {value.page} of {value.pages} · {value.total} records</span>
      <div>
        <button className="admin-button admin-button-secondary" disabled={value.page <= 1} onClick={() => onChange(value.page - 1)} type="button">Previous</button>
        <button className="admin-button admin-button-secondary" disabled={value.page >= value.pages} onClick={() => onChange(value.page + 1)} type="button">Next</button>
      </div>
    </div>
  );
}

export function formatAdminDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export function formatAdminCurrency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value) || 0);
}

export function studentName(student) {
  return student ? `${student.firstName} ${student.lastName}` : "Unknown student";
}
