"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { adminRequest } from "../_lib/adminApi";
import { useAdminData } from "../_lib/useAdminData";
import { EmptyState, ErrorState, formatAdminDate, LoadingState, PageHeading } from "./AdminUI";

export default function AdminPrdsClient() {
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const { result, error, isLoading } = useAdminData("/prds");
  const visiblePrds = useMemo(() => (result?.prds || []).filter((prd) => (
    (status === "all" || prd.status === status)
    && (!query.trim() || (prd.title + " " + prd.projectName).toLowerCase().includes(query.trim().toLowerCase()))
  )), [result, status, query]);

  return (
    <>
      <PageHeading
        title="PRD Management"
        description="Create structured product requirements documents, save drafts, and publish approved plans."
        actions={<Link className="admin-button admin-button-primary" href="/admin/prds/new">Create PRD</Link>}
      />
      <div className="admin-filter-bar">
        <label className="admin-search-field">Search PRDs<input onChange={(event) => setQuery(event.target.value)} placeholder="Title or project name" value={query} /></label>
        <label>Status<select onChange={(event) => setStatus(event.target.value)} value={status}><option value="all">All documents</option><option value="draft">Drafts</option><option value="published">Published</option></select></label>
      </div>
      {isLoading && <LoadingState>Loading product requirements documents…</LoadingState>}
      {error && <ErrorState>{error}</ErrorState>}
      {result && (visiblePrds.length ? (
        <div className="admin-prd-grid">
          {visiblePrds.map((prd) => (
            <article className="admin-prd-card" key={prd.id}>
              <div className="admin-prd-card-top"><span className={"admin-status " + (prd.status === "published" ? "is-healthy" : "is-draft")}>{prd.status}</span><time>Updated {formatAdminDate(prd.updatedAt)}</time></div>
              <h2>{prd.title}</h2>
              <p className="admin-prd-project">{prd.projectName}</p>
              <p className="admin-prd-summary">{prd.overview}</p>
              <div className="admin-prd-card-footer"><span>Created {formatAdminDate(prd.createdAt)}</span><Link className="admin-link-button" href={"/admin/prds/" + prd.id}>Open document</Link></div>
            </article>
          ))}
        </div>
      ) : <EmptyState>{query ? "No PRDs match your search." : "No PRDs yet. Create the YouthBiz product requirements document to get started."}</EmptyState>)}
    </>
  );
}

const listFields = [
  ["objectives", "Project objectives", "One objective per line."],
  ["targetUsers", "Target users", "One user group per line."],
  ["proposedSolutions", "Proposed solutions", "One solution per line."],
  ["userStories", "User stories", "Example: As a student, I want to track stock so I know what is available."],
  ["functionalRequirements", "Functional requirements", "One requirement per line."],
  ["nonFunctionalRequirements", "Non-functional requirements", "One requirement per line."],
  ["acceptanceCriteria", "Acceptance criteria", "One criterion per line."],
  ["scope", "In scope", "One scope item per line."],
  ["outOfScope", "Out of scope", "One item per line."],
  ["successMetrics", "Success metrics", "One measurable outcome per line."],
];

function emptyForm() {
  return {
    title: "",
    projectName: "",
    overview: "",
    problemStatement: "",
    objectives: "",
    targetUsers: "",
    proposedSolutions: "",
    userStories: "",
    functionalRequirements: "",
    nonFunctionalRequirements: "",
    rolePermissions: "",
    featuresWorkflows: "",
    acceptanceCriteria: "",
    scope: "",
    outOfScope: "",
    successMetrics: "",
  };
}

function formFromPrd(prd) {
  return {
    title: prd.title,
    projectName: prd.projectName,
    overview: prd.overview,
    problemStatement: prd.problemStatement,
    objectives: prd.objectives.join("\n"),
    targetUsers: prd.targetUsers.join("\n"),
    proposedSolutions: prd.proposedSolutions.join("\n"),
    userStories: prd.userStories.join("\n"),
    functionalRequirements: prd.functionalRequirements.join("\n"),
    nonFunctionalRequirements: prd.nonFunctionalRequirements.join("\n"),
    rolePermissions: prd.rolePermissions.map((entry) => entry.role + ": " + entry.permissions.join("; ")).join("\n"),
    featuresWorkflows: prd.featuresWorkflows,
    acceptanceCriteria: prd.acceptanceCriteria.join("\n"),
    scope: prd.scope.join("\n"),
    outOfScope: prd.outOfScope.join("\n"),
    successMetrics: prd.successMetrics.join("\n"),
  };
}

function toPrdPayload(form, status) {
  const splitLines = (value) => value.split("\n").map((line) => line.trim()).filter(Boolean);
  const rolePermissions = splitLines(form.rolePermissions).map((line) => {
    const separator = line.indexOf(":");
    return separator < 1 ? { role: line, permissions: [] } : {
      role: line.slice(0, separator).trim(),
      permissions: line.slice(separator + 1).split(";").map((permission) => permission.trim()).filter(Boolean),
    };
  });
  return {
    title: form.title,
    projectName: form.projectName,
    overview: form.overview,
    problemStatement: form.problemStatement,
    objectives: splitLines(form.objectives),
    targetUsers: splitLines(form.targetUsers),
    proposedSolutions: splitLines(form.proposedSolutions),
    userStories: splitLines(form.userStories),
    functionalRequirements: splitLines(form.functionalRequirements),
    nonFunctionalRequirements: splitLines(form.nonFunctionalRequirements),
    rolePermissions,
    featuresWorkflows: form.featuresWorkflows,
    acceptanceCriteria: splitLines(form.acceptanceCriteria),
    scope: splitLines(form.scope),
    outOfScope: splitLines(form.outOfScope),
    successMetrics: splitLines(form.successMetrics),
    status,
  };
}

export function PrdEditorClient({ prdId }) {
  const prdState = useAdminData(prdId ? "/prds/" + prdId : null);
  if (prdId && prdState.isLoading) return <><PageHeading title="Edit PRD" /><LoadingState>Loading PRD…</LoadingState></>;
  if (prdId && prdState.error) return <><PageHeading title="Edit PRD" /><ErrorState>{prdState.error}</ErrorState></>;
  if (prdId && !prdState.result) return null;
  return <PrdForm key={prdId || "new"} prd={prdState.result?.prd || null} />;
}

function PrdForm({ prd }) {
  const router = useRouter();
  const [form, setForm] = useState(() => prd ? formFromPrd(prd) : emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const editing = Boolean(prd);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  }

  async function save(status) {
    setSaving(true);
    setError("");
    setMessage("");
    setFieldErrors({});
    try {
      const result = await adminRequest(editing ? "/prds/" + prd.id : "/prds", {
        method: editing ? "PUT" : "POST",
        body: toPrdPayload(form, status),
      });
      setMessage(status === "published" ? "PRD published." : "Draft saved.");
      if (!editing) {
        router.replace("/admin/prds/" + result.prd.id);
        router.refresh();
      }
    } catch (requestError) {
      setError(requestError.message || "Could not save this PRD.");
      setFieldErrors(requestError.fieldErrors || {});
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this PRD permanently? This cannot be undone.")) return;
    setSaving(true);
    try {
      await adminRequest("/prds/" + prd.id, { method: "DELETE" });
      router.replace("/admin/prds");
      router.refresh();
    } catch (requestError) {
      setError(requestError.message || "Could not delete this PRD.");
      setSaving(false);
    }
  }

  function textField(field, label, placeholder, rows = 4) {
    return <label className="admin-editor-field admin-editor-wide" key={field}>{label}<textarea maxLength={field === "featuresWorkflows" ? 10000 : 5000} onChange={(event) => update(field, event.target.value)} placeholder={placeholder} rows={rows} value={form[field]} />{fieldErrors[field] && <small className="admin-field-error">{fieldErrors[field]}</small>}</label>;
  }

  return (
    <>
      <PageHeading
        eyebrow={editing ? "PRD editor" : "New document"}
        title={editing ? prd.title : "Create a PRD"}
        description={editing ? "Edit the document structure, save a draft, or publish it for the team." : "Build a complete Product Requirements Document for YouthBiz."}
        actions={<Link className="admin-button admin-button-secondary" href="/admin/prds">Back to PRD list</Link>}
      />
      {error && <ErrorState>{error}</ErrorState>}
      {message && <p className="admin-success-message" role="status">{message}</p>}
      {editing && <div className="admin-prd-meta"><span className={"admin-status " + (prd.status === "published" ? "is-healthy" : "is-draft")}>{prd.status}</span><span>Created {formatAdminDate(prd.createdAt)}</span><span>Last updated {formatAdminDate(prd.updatedAt)}</span><span>Author {prd.createdBy?.email || "Admin"}</span></div>}
      <form className="admin-prd-editor" onSubmit={(event) => { event.preventDefault(); save("draft"); }}>
        <section className="admin-panel admin-editor-section">
          <h2>Document overview</h2>
          <div className="admin-editor-grid">
            <label className="admin-editor-field">PRD title<input maxLength={160} onChange={(event) => update("title", event.target.value)} required value={form.title} /></label>
            <label className="admin-editor-field">Project name<input maxLength={160} onChange={(event) => update("projectName", event.target.value)} required value={form.projectName} /></label>
            {textField("overview", "Project overview", "Summarize the product, intended users, and value.", 5)}
            {textField("problemStatement", "Problem statement", "Describe the user problem this project addresses.", 5)}
          </div>
        </section>
        <section className="admin-panel admin-editor-section">
          <h2>Goals and users</h2>
          <div className="admin-editor-grid">
            {listFields.slice(0, 3).map(([field, label, placeholder]) => textField(field, label, placeholder))}
          </div>
        </section>
        <section className="admin-panel admin-editor-section">
          <h2>Stories and requirements</h2>
          <div className="admin-editor-grid">
            {listFields.slice(3, 6).map(([field, label, placeholder]) => textField(field, label, placeholder))}
            {textField("rolePermissions", "User roles and permissions", "One role per line, formatted as: Role: permission one; permission two", 5)}
            {textField("featuresWorkflows", "Features and workflows", "Describe the main product features and the steps users follow.", 6)}
            {listFields.slice(6).map(([field, label, placeholder]) => textField(field, label, placeholder))}
          </div>
        </section>
        <div className="admin-editor-actions">
          {editing && <button className="admin-button admin-button-danger" disabled={saving} onClick={remove} type="button">Delete PRD</button>}
          <div><button className="admin-button admin-button-secondary" disabled={saving} onClick={() => save("draft")} type="button">{saving ? "Saving…" : "Save draft"}</button><button className="admin-button admin-button-primary" disabled={saving} onClick={() => save("published")} type="button">{saving ? "Saving…" : "Publish PRD"}</button></div>
        </div>
      </form>
    </>
  );
}

