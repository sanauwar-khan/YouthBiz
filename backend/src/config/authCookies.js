export const SESSION_COOKIE = "youthbiz_session";
export const CSRF_COOKIE = "youthbiz_csrf";

const secure = process.env.NODE_ENV === "production";

export const sessionCookieOptions = {
  httpOnly: true,
  secure,
  sameSite: "lax",
  path: "/api",
};

export const csrfCookieOptions = {
  httpOnly: false,
  secure,
  sameSite: "strict",
  path: "/api",
  maxAge: 15 * 60 * 1000,
};

export const csrfCookieClearOptions = {
  secure,
  sameSite: "strict",
  path: "/api",
};