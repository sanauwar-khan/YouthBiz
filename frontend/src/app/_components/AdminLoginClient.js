"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitAdminLogin } from "../_lib/adminApi";

export default function AdminLoginClient() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await submitAdminLogin(form);
      router.replace("/admin");
      router.refresh();
    } catch (requestError) {
      setError(requestError.message || "Could not sign in. Check your details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="admin-login-page">
      <header className="admin-login-header">
        <Link className="admin-brand admin-brand-light" href="/"><span className="admin-brand-mark">Y</span><span>YouthBiz</span></Link>
      </header>
      <section className="admin-login-card" aria-labelledby="admin-login-heading">
        <p className="admin-eyebrow">Restricted access</p>
        <h1 id="admin-login-heading">Admin sign in</h1>
        <p>Sign in with your YouthBiz administrator account.</p>
        <form className="admin-form" onSubmit={submit}>
          <label>Email address<input autoComplete="username" autoCapitalize="none" maxLength={254} onChange={(event) => setForm({ ...form, email: event.target.value })} required type="email" value={form.email} /></label>
          <label>Password<input autoComplete="current-password" maxLength={256} onChange={(event) => setForm({ ...form, password: event.target.value })} required type="password" value={form.password} /></label>
          {error && <p className="admin-form-error" role="alert">{error}</p>}
          <button className="admin-button admin-button-primary admin-button-wide" disabled={isSubmitting} type="submit">{isSubmitting ? "Signing in…" : "Sign in securely"}</button>
        </form>
        <Link className="admin-login-back" href="/">← Return to YouthBiz</Link>
      </section>
    </main>
  );
}
