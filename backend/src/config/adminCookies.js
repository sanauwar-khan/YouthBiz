export const ADMIN_SESSION_COOKIE = "youthbiz_admin_session";

const secure = process.env.NODE_ENV === "production";

export const adminSessionCookieOptions = {
  httpOnly: true,
  secure,
  sameSite: secure ? "none" : "lax",
  path: "/api/admin",
};
