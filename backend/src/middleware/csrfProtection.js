import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { allowedOrigins } from "../config/origins.js";
import { CSRF_COOKIE, csrfCookieClearOptions, csrfCookieOptions } from "../config/authCookies.js";

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left || "");
  const rightBuffer = Buffer.from(right || "");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function signatureFor(nonce) {
  return createHmac("sha256", `${process.env.JWT_SECRET}:csrf`)
    .update(nonce)
    .digest("base64url");
}

function isSignedToken(token) {
  const [nonce, signature, ...extra] = String(token || "").split(".");
  return Boolean(nonce && signature && extra.length === 0 && safeEqual(signature, signatureFor(nonce)));
}

export function issueCsrfToken(_request, response) {
  const nonce = randomBytes(32).toString("base64url");
  const token = `${nonce}.${signatureFor(nonce)}`;

  // response.clearCookie(CSRF_COOKIE, { ...csrfCookieClearOptions, path: "/api/auth" });
  response.cookie(CSRF_COOKIE, token, csrfCookieOptions);
  response.set("Cache-Control", "no-store").json({ csrfToken: token });
}

export function requireCsrfToken(request, response, next) {
  const origin = request.get("origin");
  if (origin && !allowedOrigins.includes(origin.replace(/\/$/, ""))) {
    return response.status(403).json({ error: "Request origin is not allowed." });
  }

  const cookieToken = request.cookies?.[CSRF_COOKIE];
  const headerToken = request.get("x-csrf-token");
  if (!safeEqual(cookieToken, headerToken) || !isSignedToken(cookieToken)) {
    return response.status(403).json({ error: "CSRF validation failed. Refresh and try again." });
  }

  return next();
}