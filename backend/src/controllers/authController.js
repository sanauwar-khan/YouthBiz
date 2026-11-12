import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { CSRF_COOKIE, SESSION_COOKIE, csrfCookieClearOptions, sessionCookieOptions } from "../config/authCookies.js";
import { loginSchema, registerSchema } from "../validation/authSchemas.js";
import { issueCsrfToken } from "../middleware/csrfProtection.js";

function safeStudent(user) {
  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    ageGroup: user.ageGroup,
  };
}

function setSessionCookie(response, userId, rememberMe = false) {
  const expiresIn = rememberMe ? "7d" : process.env.JWT_EXPIRES_IN || "1d";
  const token = jwt.sign(
    { sub: userId.toString() },
    process.env.JWT_SECRET,
    { expiresIn },
  );
  response.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions, path: "/api/auth" });
  response.cookie(SESSION_COOKIE, token, {
    ...sessionCookieOptions,
    ...(rememberMe ? { maxAge: 7 * 24 * 60 * 60 * 1000 } : {}),
  });
}

export { issueCsrfToken };

export function getCurrentStudent(request, response) {
  return response.json({ user: safeStudent(request.student) });
}

export async function registerStudent(request, response, next) {
  try {
    const data = registerSchema.parse(request.body);
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await User.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      ageGroup: data.ageGroup,
      passwordHash,
    });

    setSessionCookie(response, user._id);
    return response.status(201).json({
      message: "Student account created.",
      user: safeStudent(user),
    });
  } catch (error) {
    return next(error);
  }
}

export async function loginStudent(request, response, next) {
  try {
    const data = loginSchema.parse(request.body);
    const user = await User.findOne({ email: data.email }).select("+passwordHash");
    const passwordMatches = user && await bcrypt.compare(data.password, user.passwordHash);

    if (!passwordMatches) {
      return response.status(401).json({ error: "Email or password is incorrect." });
    }

    setSessionCookie(response, user._id, data.rememberMe);
    return response.json({
      message: "Signed in successfully.",
      user: safeStudent(user),
    });
  } catch (error) {
    return next(error);
  }
}

export function logoutStudent(_request, response) {
  response.clearCookie(SESSION_COOKIE, sessionCookieOptions);
  response.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions, path: "/api/auth" });
  response.clearCookie(CSRF_COOKIE, csrfCookieClearOptions);
  response.clearCookie(CSRF_COOKIE, { ...csrfCookieClearOptions, path: "/api/auth" });
  return response.json({ message: "Signed out successfully." });
}