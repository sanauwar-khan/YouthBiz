import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import { ADMIN_SESSION_COOKIE } from "../config/adminCookies.js";

export async function requireAdminAuth(request, response, next) {
  const token = request.cookies?.[ADMIN_SESSION_COOKIE];
  if (!token) return response.status(401).json({ error: "Admin sign-in is required." });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "youthbiz-admin",
      audience: "youthbiz-admin",
    });
    if (payload.role !== "admin" || typeof payload.sub !== "string") {
      return response.status(401).json({ error: "The admin session is invalid." });
    }
    const admin = await Admin.findOne({ _id: payload.sub, isActive: true }).select("email createdAt");
    if (!admin) return response.status(401).json({ error: "The admin session is no longer valid." });
    request.admin = admin;
    return next();
  } catch (error) {
    if (["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(error?.name)) {
      return response.status(401).json({ error: "The admin session has expired. Please sign in again." });
    }
    return next(error);
  }
}
