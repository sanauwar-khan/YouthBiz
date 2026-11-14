"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { submitAuth } from "../_lib/authApi";

function RequiredMark() {
  return (
    <>
      <span className="required-mark" aria-hidden="true">*</span>
      <span className="sr-only"> required</span>
    </>
  );
}

function FieldError({ id, message }) {
  return message ? <span className="auth-field-error" id={id}>{message}</span> : null;
}

export default function AuthPage({ mode, registrationSuccess = false }) {
  const isRegister = mode === "register";
  const router = useRouter();
  const [notice, setNotice] = useState(registrationSuccess ? "Student account created. Please log in." : "");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const errors = {};
    const requiredFields = isRegister
      ? ["firstName", "lastName", "email", "ageGroup", "password", "confirmPassword"]
      : ["email", "password"];

    for (const field of requiredFields) {
      if (!String(formData.get(field) || "").trim()) {
        errors[field] = "This field is required.";
      }
    }

    const email = String(formData.get("email") || "").trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Enter a valid email address.";
    }

    const password = String(formData.get("password") || "");
    if (password && password.length < 8) {
      errors.password = "Use at least 8 characters.";
    }

    if (isRegister && formData.get("confirmPassword") && password !== formData.get("confirmPassword")) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setNotice("Please review the highlighted fields.");
      return;
    }

    const payload = isRegister
      ? {
          firstName: String(formData.get("firstName")).trim(),
          lastName: String(formData.get("lastName")).trim(),
          email: String(formData.get("email")).trim(),
          ageGroup: formData.get("ageGroup"),
          password: formData.get("password"),
          confirmPassword: formData.get("confirmPassword"),
        }
      : {
          email: String(formData.get("email")).trim(),
          password: formData.get("password"),
          rememberMe: formData.get("rememberMe") === "on",
        };

    setFieldErrors({});
    setNotice("");
    setIsSubmitting(true);
    try {
      const result = await submitAuth(isRegister ? "register" : "login", payload);
      if (!result.user?.id) {
        throw new Error("YouthBiz could not confirm the account. Please try again.");
      }

      if (isRegister) {
        router.push("/dashboard");
        return;
      }

      setNotice(result.message || "Signed in successfully.");
      router.push("/dashboard");
    } catch (error) {
      setFieldErrors(error.fieldErrors || {});
      setNotice(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={`auth-page ${isRegister ? "auth-page--register" : "auth-page--login"}`}>
      <header className={`auth-header ${isRegister ? "auth-header-register" : ""}`}>
        <Link className="brand" href="/" aria-label="YouthBiz home">
          <span className="brand-mark" aria-hidden="true">Y</span>
          <span>YouthBiz</span>
        </Link>
        <div className="auth-header-prompt">
          <span>{isRegister ? "Already have an account?" : "New to YouthBiz?"}</span>
          <a href={isRegister ? "/login" : "/register"}>
            {isRegister ? "Log in" : "Join the club"}
          </a>
        </div>
      </header>

      <div className={`auth-layout ${isRegister ? "auth-layout-register" : "auth-layout-login"}`}>
        <aside className={`auth-intro ${isRegister ? "auth-intro-register" : "auth-intro-login"}`}>
          <p className="eyebrow"><span className="eyebrow-dot" /> A little business. A lot of possibility.</p>
          <h1>{isRegister ? <>Your next big idea<br />starts <span>right here.</span></> : <>Good to have<br />you <span>back.</span></>}</h1>
          <p className="auth-intro-copy">
            {isRegister
              ? "Explore entrepreneurship, understand your money, and turn a spark of an idea into something real."
              : "Pick up where your ideas left off. Your next small step can grow into something big."}
          </p>
          <div className="auth-points">
            <div><span className="auth-point-icon idea-icon" aria-hidden="true">✳</span><span><strong>{isRegister ? "Turn ideas into real products" : "Make your idea real"}</strong><small>{isRegister ? "Shape a first idea into something people can use." : "Learn by creating something of your own."}</small></span></div>
            <div><span className="auth-point-icon make-icon" aria-hidden="true">◒</span><span><strong>{isRegister ? "Learn budgeting, costs and profits" : "Get comfortable with money"}</strong><small>{isRegister ? "Understand what it costs and what you earn." : "Track costs, sales, and what you earn."}</small></span></div>
            <div><span className="auth-point-icon grow-icon" aria-hidden="true">↗</span><span><strong>{isRegister ? "Build entrepreneurial confidence" : "Grow at your own pace"}</strong><small>{isRegister ? "Practice sharing your ideas and making decisions." : "Every great business starts somewhere."}</small></span></div>
          </div>
          {isRegister && (
            <div className="register-visual" role="img" aria-label="Illustration of a growing student business with rising weekly sales">
              <span className="register-visual-mark" aria-hidden="true">✳</span>
              <div className="register-visual-copy"><span>YOUR IDEAS, IN MOTION</span><strong>Little steps add up.</strong><small>Plan it. Make it. Grow it.</small></div>
              <div className="register-visual-chart" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
              <span className="register-visual-arrow" aria-hidden="true">↗</span>
            </div>
          )}
        </aside>

        <section className={`auth-panel ${isRegister ? "auth-panel-register" : "auth-panel-login"}`} aria-labelledby="auth-title">
          <div className="auth-panel-heading">
            <p className="eyebrow">{isRegister ? "Your first step" : "Your workspace awaits"}</p>
            <h2 id="auth-title">{isRegister ? "Create your account" : "Log in to YouthBiz"}</h2>
            <p>{isRegister ? "Start your entrepreneurial journey with YouthBiz." : "Enter your account details to continue."}</p>
          </div>

          <form className={`auth-form ${isRegister ? "auth-form-register" : "auth-form-login"}`} noValidate onSubmit={handleSubmit}>
            {isRegister && (
              <div className="auth-field-row">
                <div className="auth-field">
                  <label htmlFor="firstName">First name <RequiredMark /></label>
                  <input aria-describedby={fieldErrors.firstName ? "firstName-error" : undefined} aria-invalid={Boolean(fieldErrors.firstName)} autoComplete="given-name" id="firstName" name="firstName" placeholder="Your first name" required />
                  <FieldError id="firstName-error" message={fieldErrors.firstName} />
                </div>
                <div className="auth-field">
                  <label htmlFor="lastName">Last name <RequiredMark /></label>
                  <input aria-describedby={fieldErrors.lastName ? "lastName-error" : undefined} aria-invalid={Boolean(fieldErrors.lastName)} autoComplete="family-name" id="lastName" name="lastName" placeholder="Your last name" required />
                  <FieldError id="lastName-error" message={fieldErrors.lastName} />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="email">Email address <RequiredMark /></label>
              <input aria-describedby={fieldErrors.email ? "email-error" : undefined} aria-invalid={Boolean(fieldErrors.email)} autoComplete="email" id="email" name="email" placeholder="you@example.com" required type="email" />
              <FieldError id="email-error" message={fieldErrors.email} />
            </div>

            {isRegister && (
              <div className="auth-field">
                <label htmlFor="ageGroup">Age group <RequiredMark /></label>
                <select aria-describedby={fieldErrors.ageGroup ? "ageGroup-error" : undefined} aria-invalid={Boolean(fieldErrors.ageGroup)} defaultValue="" id="ageGroup" name="ageGroup" required>
                  <option disabled value="">Choose your age group</option>
                  <option value="8-12">8–12</option>
                  <option value="13-17">13–17</option>
                </select>
                <FieldError id="ageGroup-error" message={fieldErrors.ageGroup} />
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="password">Password <RequiredMark /></label>
              <div className="auth-password-wrap">
                <input aria-describedby={fieldErrors.password ? "password-error" : undefined} aria-invalid={Boolean(fieldErrors.password)} autoComplete={isRegister ? "new-password" : "current-password"} id="password" minLength={8} name="password" placeholder="At least 8 characters" required type={showPassword ? "text" : "password"} />
                <button aria-controls="password" aria-label={showPassword ? "Hide password" : "Show password"} className="auth-password-toggle" onClick={() => setShowPassword((visible) => !visible)} type="button">{showPassword ? "Hide" : "Show"}</button>
              </div>
              <FieldError id="password-error" message={fieldErrors.password} />
              {isRegister && !fieldErrors.password && <span className="auth-field-hint">Use at least 8 characters.</span>}
            </div>

            {isRegister ? (
              <div className="auth-field">
                <label htmlFor="confirmPassword">Confirm password <RequiredMark /></label>
                <div className="auth-password-wrap">
                  <input aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined} aria-invalid={Boolean(fieldErrors.confirmPassword)} autoComplete="new-password" id="confirmPassword" minLength={8} name="confirmPassword" placeholder="Enter your password again" required type={showConfirmPassword ? "text" : "password"} />
                  <button aria-controls="confirmPassword" aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"} className="auth-password-toggle" onClick={() => setShowConfirmPassword((visible) => !visible)} type="button">{showConfirmPassword ? "Hide" : "Show"}</button>
                </div>
                <FieldError id="confirmPassword-error" message={fieldErrors.confirmPassword} />
              </div>
            ) : (
              <div className="auth-help-row">
                <label className="remember-option"><input name="rememberMe" type="checkbox" /> <span>Remember me</span></label>
                <button className="forgot-password" onClick={() => setNotice("Password reset will be available when YouthBiz account services launch.")} type="button">Forgot Password?</button>
              </div>
            )}

            <button className="button button-dark auth-submit" disabled={isSubmitting} type="submit">
              {isSubmitting ? (isRegister ? "Creating account..." : "Signing in...") : (isRegister ? "Create Student Account" : "Sign In")}<span aria-hidden="true">↗</span>
            </button>
            {notice && <p aria-live="polite" className="auth-notice" role="status">{notice}</p>}
          </form>

          <p className="auth-panel-footnote">
            {isRegister ? "A parent or guardian can help you get started." : "Your account is for your YouthBiz activities."}
          </p>
        </section>
      </div>

      <footer className={`auth-footer ${isRegister ? "auth-footer-register" : ""}`}>
        <Link href="/">← Back to YouthBiz</Link>
        {isRegister && <Link href="/privacy-policy">Privacy Policy</Link>}
        {isRegister && <Link href="/terms-of-service">Terms of Service</Link>}
        <a href="mailto:hello@youthbiz.club">Get in touch</a>
      </footer>
    </main>
  );
}