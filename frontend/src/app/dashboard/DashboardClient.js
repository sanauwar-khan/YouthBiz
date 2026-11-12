"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { dashboardRequest, loadDashboard } from "../_lib/dashboardApi";

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
}

function dateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateLabel(value) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function EmptyState({ children }) {
  return <p className="student-empty-state">{children}</p>;
}

export default function DashboardClient() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [ideaDraft, setIdeaDraft] = useState({ title: "", description: "" });
  const [editingIdea, setEditingIdea] = useState(null);
  const [transactionDraft, setTransactionDraft] = useState({ type: "income", title: "", amount: "", occurredAt: "" });
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [stepDraft, setStepDraft] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function initialize() {
      try {
        const data = await loadDashboard(controller.signal);
        setDashboard(data);
        setLoadError("");
      } catch (error) {
        if (error.name === "AbortError") return;
        if (error.status === 401) {
          router.replace("/login");
          return;
        }
        setLoadError(error.message || "Your dashboard could not be loaded.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    initialize();
    return () => controller.abort();
  }, [router]);

  async function performAction(action) {
    setActionError("");
    setIsSaving(true);
    try {
      await action();
      const data = await loadDashboard();
      setDashboard(data);
      return true;
    } catch (error) {
      if (error.status === 401) {
        router.replace("/login");
        return false;
      }
      setActionError(error.message || "That change could not be saved. Please try again.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function createIdea(event) {
    event.preventDefault();
    const saved = await performAction(() => dashboardRequest("/ideas", {
      method: "POST",
      body: ideaDraft,
    }));
    if (saved) setIdeaDraft({ title: "", description: "" });
  }

  async function saveIdea(event) {
    event.preventDefault();
    const saved = await performAction(() => dashboardRequest(`/ideas/${editingIdea.id}`, {
      method: "PATCH",
      body: { title: editingIdea.title, description: editingIdea.description },
    }));
    if (saved) setEditingIdea(null);
  }

  async function deleteIdea(ideaId) {
    await performAction(() => dashboardRequest(`/ideas/${ideaId}`, { method: "DELETE" }));
  }

  async function createTransaction(event) {
    event.preventDefault();
    const body = {
      type: transactionDraft.type,
      title: transactionDraft.title,
      amount: Number(transactionDraft.amount),
      ...(transactionDraft.occurredAt ? { occurredAt: new Date(`${transactionDraft.occurredAt}T12:00:00`).toISOString() } : {}),
    };
    const saved = await performAction(() => dashboardRequest("/finance/transactions", { method: "POST", body }));
    if (saved) setTransactionDraft({ type: "income", title: "", amount: "", occurredAt: "" });
  }

  async function saveTransaction(event) {
    event.preventDefault();
    const body = {
      type: editingTransaction.type,
      title: editingTransaction.title,
      amount: Number(editingTransaction.amount),
      occurredAt: new Date(`${editingTransaction.occurredAt}T12:00:00`).toISOString(),
    };
    const saved = await performAction(() => dashboardRequest(`/finance/transactions/${editingTransaction.id}`, { method: "PATCH", body }));
    if (saved) setEditingTransaction(null);
  }

  async function deleteTransaction(transactionId) {
    await performAction(() => dashboardRequest(`/finance/transactions/${transactionId}`, { method: "DELETE" }));
  }

  async function createStep(event) {
    event.preventDefault();
    const saved = await performAction(() => dashboardRequest("/progress", {
      method: "POST",
      body: { title: stepDraft },
    }));
    if (saved) setStepDraft("");
  }

  async function updateStep(step, changes) {
    await performAction(() => dashboardRequest(`/progress/${step.id}`, {
      method: "PATCH",
      body: changes,
    }));
  }

  async function deleteStep(stepId) {
    await performAction(() => dashboardRequest(`/progress/${stepId}`, { method: "DELETE" }));
  }

  if (isLoading) {
    return <main className="student-dashboard-page"><div aria-live="polite" className="dashboard-loading">Loading your workspace...</div></main>;
  }

  if (loadError) {
    return (
      <main className="student-dashboard-page">
        <div className="dashboard-load-error" role="alert">
          <strong>We couldn’t load your workspace.</strong>
          <p>{loadError}</p>
          <button className="button button-dark" onClick={() => window.location.reload()} type="button">Try again</button>
        </div>
      </main>
    );
  }

  if (!dashboard) return null;

  const { user, ideas, finance, steps } = dashboard;

  return (
    <main className="student-dashboard-page">
      <header className="auth-header student-dashboard-header">
        <Link className="brand" href="/" aria-label="YouthBiz home">
          <span className="brand-mark" aria-hidden="true">Y</span>
          <span>YouthBiz</span>
        </Link>
        <nav aria-label="Dashboard navigation" className="student-dashboard-nav">
          <a href="#ideas">Business ideas</a>
          <a href="#money">Money basics</a>
          <a href="#progress">Next steps</a>
        </nav>
        <span className="student-dashboard-label"><span aria-hidden="true" /> Student workspace</span>
      </header>

      <section className="student-dashboard-content" aria-labelledby="dashboard-title">
        <p className="eyebrow"><span className="eyebrow-dot" /> Your YouthBiz workspace</p>
        <h1 id="dashboard-title">Welcome, <span>{user.firstName}.</span></h1>
        <p className="student-dashboard-intro">Ready to grow an idea? Keep track of what you’re making, what you’re earning, and the next step you want to take.</p>

        <div className="dashboard-summary" aria-label="Money summary">
          <div><span>Total income</span><strong>{formatMoney(finance.summary.income)}</strong></div>
          <div><span>Total expenses</span><strong>{formatMoney(finance.summary.expenses)}</strong></div>
          <div><span>Profit</span><strong className={finance.summary.profit < 0 ? "negative-value" : "positive-value"}>{formatMoney(finance.summary.profit)}</strong></div>
        </div>

        {actionError && <p className="dashboard-action-error" role="alert">{actionError}</p>}

        <section className="dashboard-feature" id="ideas" aria-labelledby="ideas-heading">
          <div className="dashboard-feature-heading">
            <div><p className="eyebrow">Plan it</p><h2 id="ideas-heading">Business ideas</h2></div>
            <span className="dashboard-count">{ideas.length} {ideas.length === 1 ? "idea" : "ideas"}</span>
          </div>
          <div className="dashboard-feature-grid">
            <form className="dashboard-form" onSubmit={createIdea}>
              <h3>Add a business idea</h3>
              <label>Idea name<input maxLength={100} onChange={(event) => setIdeaDraft({ ...ideaDraft, title: event.target.value })} placeholder="e.g. Handmade bookmarks" required value={ideaDraft.title} /></label>
              <label>What will you make or sell?<textarea maxLength={1200} onChange={(event) => setIdeaDraft({ ...ideaDraft, description: event.target.value })} placeholder="A few details about your idea" rows={3} value={ideaDraft.description} /></label>
              <button className="button button-dark" disabled={isSaving} type="submit">{isSaving ? "Saving..." : "Add idea"}</button>
            </form>
            <div className="dashboard-list" aria-live="polite">
              {ideas.length === 0 ? <EmptyState>Your first idea goes here. Start with something you enjoy making or doing.</EmptyState> : ideas.map((idea) => (
                <article className="dashboard-list-item" key={idea.id}>
                  {editingIdea?.id === idea.id ? (
                    <form className="dashboard-inline-form" onSubmit={saveIdea}>
                      <label>Idea name<input maxLength={100} onChange={(event) => setEditingIdea({ ...editingIdea, title: event.target.value })} required value={editingIdea.title} /></label>
                      <label>Description<textarea maxLength={1200} onChange={(event) => setEditingIdea({ ...editingIdea, description: event.target.value })} rows={2} value={editingIdea.description} /></label>
                      <div className="dashboard-item-actions"><button className="dashboard-text-button" disabled={isSaving} type="submit">Save</button><button className="dashboard-text-button" onClick={() => setEditingIdea(null)} type="button">Cancel</button></div>
                    </form>
                  ) : (
                    <><div><h3>{idea.title}</h3><p>{idea.description || "No description yet."}</p><small>Updated {dateLabel(idea.updatedAt)}</small></div><div className="dashboard-item-actions"><button className="dashboard-text-button" onClick={() => setEditingIdea({ id: idea.id, title: idea.title, description: idea.description })} type="button">Edit</button><button className="dashboard-text-button danger-text" disabled={isSaving} onClick={() => deleteIdea(idea.id)} type="button">Delete</button></div></>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="dashboard-feature" id="money" aria-labelledby="money-heading">
          <div className="dashboard-feature-heading">
            <div><p className="eyebrow">Know your numbers</p><h2 id="money-heading">Money basics</h2></div>
            <span className="dashboard-count">Profit = income − expenses</span>
          </div>
          <div className="dashboard-feature-grid">
            <form className="dashboard-form" onSubmit={createTransaction}>
              <h3>Track money</h3>
              <label>Type<select onChange={(event) => setTransactionDraft({ ...transactionDraft, type: event.target.value })} value={transactionDraft.type}><option value="income">Income</option><option value="expense">Expense</option></select></label>
              <label>Description<input maxLength={100} onChange={(event) => setTransactionDraft({ ...transactionDraft, title: event.target.value })} placeholder="e.g. Craft fair sale" required value={transactionDraft.title} /></label>
              <label>Amount ($)<input inputMode="decimal" max="10000000" min="0.01" onChange={(event) => setTransactionDraft({ ...transactionDraft, amount: event.target.value })} placeholder="0.00" required step="0.01" type="number" value={transactionDraft.amount} /></label>
              <label>Date<input onChange={(event) => setTransactionDraft({ ...transactionDraft, occurredAt: event.target.value })} type="date" value={transactionDraft.occurredAt} /></label>
              <button className="button button-dark" disabled={isSaving} type="submit">{isSaving ? "Saving..." : "Add transaction"}</button>
            </form>
            <div className="dashboard-list" aria-live="polite">
              {finance.transactions.length === 0 ? <EmptyState>No money tracked yet. Add a sale or expense to see your profit.</EmptyState> : finance.transactions.map((transaction) => (
                <article className="dashboard-list-item transaction-item" key={transaction.id}>
                  {editingTransaction?.id === transaction.id ? (
                    <form className="dashboard-inline-form transaction-edit-form" onSubmit={saveTransaction}>
                      <label>Type<select onChange={(event) => setEditingTransaction({ ...editingTransaction, type: event.target.value })} value={editingTransaction.type}><option value="income">Income</option><option value="expense">Expense</option></select></label>
                      <label>Description<input maxLength={100} onChange={(event) => setEditingTransaction({ ...editingTransaction, title: event.target.value })} required value={editingTransaction.title} /></label>
                      <label>Amount ($)<input min="0.01" onChange={(event) => setEditingTransaction({ ...editingTransaction, amount: event.target.value })} required step="0.01" type="number" value={editingTransaction.amount} /></label>
                      <label>Date<input onChange={(event) => setEditingTransaction({ ...editingTransaction, occurredAt: event.target.value })} required type="date" value={editingTransaction.occurredAt} /></label>
                      <div className="dashboard-item-actions"><button className="dashboard-text-button" disabled={isSaving} type="submit">Save</button><button className="dashboard-text-button" onClick={() => setEditingTransaction(null)} type="button">Cancel</button></div>
                    </form>
                  ) : (
                    <><div><span className={`transaction-type ${transaction.type}`}>{transaction.type}</span><h3>{transaction.title}</h3><small>{dateLabel(transaction.occurredAt)}</small></div><strong className={transaction.type === "income" ? "positive-value" : "negative-value"}>{transaction.type === "income" ? "+" : "−"}{formatMoney(transaction.amount)}</strong><div className="dashboard-item-actions"><button className="dashboard-text-button" onClick={() => setEditingTransaction({ id: transaction.id, type: transaction.type, title: transaction.title, amount: String(transaction.amount), occurredAt: dateInputValue(transaction.occurredAt) })} type="button">Edit</button><button className="dashboard-text-button danger-text" disabled={isSaving} onClick={() => deleteTransaction(transaction.id)} type="button">Delete</button></div></>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="dashboard-feature" id="progress" aria-labelledby="progress-heading">
          <div className="dashboard-feature-heading">
            <div><p className="eyebrow">Keep moving</p><h2 id="progress-heading">Your next steps</h2></div>
            <span className="dashboard-count">{steps.filter((step) => step.completed).length} of {steps.length} complete</span>
          </div>
          <form className="dashboard-step-form" onSubmit={createStep}>
            <label className="sr-only" htmlFor="new-step">Add a next step</label>
            <input id="new-step" maxLength={120} onChange={(event) => setStepDraft(event.target.value)} placeholder="Add a small goal or next step" required value={stepDraft} />
            <button className="button button-dark" disabled={isSaving} type="submit">Add step</button>
          </form>
          <div className="dashboard-progress-list" aria-live="polite">
            {steps.length === 0 ? <EmptyState>Choose one small thing you can do next, then add it here.</EmptyState> : steps.map((step) => (
              <div className={`dashboard-progress-item ${step.completed ? "is-complete" : ""}`} key={step.id}>
                <label><input checked={step.completed} onChange={(event) => updateStep(step, { completed: event.target.checked })} type="checkbox" /><span>{step.title}</span></label>
                <button aria-label={`Delete ${step.title}`} className="dashboard-text-button danger-text" disabled={isSaving} onClick={() => deleteStep(step.id)} type="button">Delete</button>
              </div>
            ))}
          </div>
        </section>
      </section>

      <footer className="auth-footer student-dashboard-footer">
        <Link href="/">← Back to YouthBiz</Link>
        <a href="mailto:hello@youthbiz.club">Get in touch</a>
      </footer>
    </main>
  );
}