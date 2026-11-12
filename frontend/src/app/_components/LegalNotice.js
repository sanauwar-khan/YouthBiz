import Link from "next/link";

export default function LegalNotice({ title, description }) {
  return (
    <main className="legal-page">
      <header className="auth-header">
        <Link className="brand" href="/" aria-label="YouthBiz home">
          <span className="brand-mark" aria-hidden="true">Y</span>
          <span>YouthBiz</span>
        </Link>
        <Link className="header-link" href="/register">Student registration</Link>
      </header>
      <article className="legal-content">
        <p className="eyebrow"><span className="eyebrow-dot" /> YouthBiz</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="legal-notice">
          YouthBiz registration is currently a preview and does not create an account or send form data to a server. We are preparing this document before account features launch. For questions, contact <a href="mailto:hello@youthbiz.club">hello@youthbiz.club</a>.
        </div>
      </article>
      <footer className="auth-footer">
        <Link href="/register">← Back to registration</Link>
        <a href="mailto:hello@youthbiz.club">Get in touch</a>
      </footer>
    </main>
  );
}