import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { SESSION_COOKIE } from "../config/authCookies.js";

export async function requireStudentAuth(request, response, next) {
  const token = request.cookies?.[SESSION_COOKIE];
  if (!token) {
    return response.status(401).json({ error: "Please log in to continue." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload || typeof payload.sub !== "string") {
      return response.status(401).json({ error: "Your session is invalid. Please log in again." });
    }

    const student = await User.findById(payload.sub).select("firstName lastName email ageGroup");
    if (!student) {
      return response.status(401).json({ error: "Your session is no longer valid. Please log in again." });
    }

    request.student = student;
    return next();
  } catch (error) {
    if (error?.name === "JsonWebTokenError" || error?.name === "TokenExpiredError") {
      return response.status(401).json({ error: "Your session has expired. Please log in again." });
    }
    return next(error);
  }
}