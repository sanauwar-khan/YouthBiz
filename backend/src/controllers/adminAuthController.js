import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import { ADMIN_SESSION_COOKIE, adminSessionCookieOptions } from "../config/adminCookies.js";
import { adminLoginSchema } from "../validation/adminSchemas.js";

const failureWindowMs = 15 * 60 * 1000;
const maxLoginFailures = 8;
const maxIpLoginFailures = 60;
const loginFailures = new Map();
const ipLoginFailures = new Map();

function loginBucket(key, buckets = loginFailures) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.expiresAt <= now) {
    const next = { count: 0, expiresAt: now + failureWindowMs };
    buckets.set(key, next);
    return next;
  }
  return current;
}

function safeAdmin(admin) {
  return { id: admin._id.toString(), email: admin.email, createdAt: admin.createdAt };
}

export async function loginAdmin(request, response, next) {
  try {
    const data = adminLoginSchema.parse(request.body);
    const ip = request.ip || "unknown";
    const emailBucket = loginBucket(data.email);
    const ipBucket = loginBucket(ip, ipLoginFailures);
    const blockedUntil = Math.max(
      emailBucket.count >= maxLoginFailures ? emailBucket.expiresAt : 0,
      ipBucket.count >= maxIpLoginFailures ? ipBucket.expiresAt : 0,
    );
    if (blockedUntil > Date.now()) {
      response.set("Retry-After", String(Math.ceil((blockedUntil - Date.now()) / 1000)));
      return response.status(429).json({ error: "Too many sign-in attempts. Please try again later." });
    }
    const admin = await Admin.findOne({ email: data.email, isActive: true }).select("+passwordHash");
    const passwordMatches = admin ? await bcrypt.compare(data.password, admin.passwordHash) : false;
    if (!passwordMatches) {
      emailBucket.count += 1;
      ipBucket.count += 1;
      return response.status(401).json({ error: "Email or password is incorrect." });
    }

    loginFailures.delete(data.email);
    ipLoginFailures.delete(ip);
    const token = jwt.sign(
      { sub: admin._id.toString(), role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || "1d", issuer: "youthbiz-admin", audience: "youthbiz-admin" },
    );
    response.cookie(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions);
    response.set("Cache-Control", "no-store");
    return response.json({ message: "Signed in successfully.", admin: safeAdmin(admin) });
  } catch (error) {
    return next(error);
  }
}

export function getCurrentAdmin(request, response) {
  response.set("Cache-Control", "no-store");
  return response.json({ admin: safeAdmin(request.admin) });
}

export function logoutAdmin(_request, response) {
  response.clearCookie(ADMIN_SESSION_COOKIE, adminSessionCookieOptions);
  return response.json({ message: "Signed out successfully." });
}
