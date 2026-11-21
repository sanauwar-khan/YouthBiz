import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Admin from "../src/models/Admin.js";

const backendEnvPath = fileURLToPath(new URL("../.env", import.meta.url));
const executedFile = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";

export class AdminSeedConfigurationError extends Error {}

function validateCredentials(email, password) {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new AdminSeedConfigurationError("Set a valid ADMIN_EMAIL in backend/.env before seeding.");
  }
  if (!password || password.length < 16 || Buffer.byteLength(password, "utf8") > 72) {
    throw new AdminSeedConfigurationError("ADMIN_PASSWORD must be at least 16 characters and no more than 72 UTF-8 bytes.");
  }
  return normalizedEmail;
}

async function findAdmin(AdminModel, filter, oldestFirst = false) {
  let query = AdminModel.findOne(filter);
  if (oldestFirst) query = query.sort({ createdAt: 1, _id: 1 });
  return query.select("+passwordHash");
}

async function updateAdmin(admin, email, passwordHash) {
  admin.email = email;
  admin.passwordHash = passwordHash;
  admin.isActive = true;
  await admin.save();
}

export async function syncAdminAccount({
  email,
  password,
  AdminModel = Admin,
  hashPassword = (value, rounds) => bcrypt.hash(value, rounds),
} = {}) {
  const normalizedEmail = validateCredentials(email, password);
  const passwordHash = await hashPassword(password, 12);
  if (typeof AdminModel.init === "function") await AdminModel.init();

  const configuredAdmin = await findAdmin(AdminModel, { email: normalizedEmail });
  const existingAdmin = configuredAdmin || await findAdmin(AdminModel, {}, true);
  if (existingAdmin) {
    await updateAdmin(existingAdmin, normalizedEmail, passwordHash);
    return { created: false };
  }

  try {
    await AdminModel.create({ email: normalizedEmail, passwordHash, isActive: true });
    return { created: true };
  } catch (error) {
    // A unique email index handles two first-run seed processes racing each other.
    if (error?.code !== 11000) throw error;
    const racedAdmin = await findAdmin(AdminModel, { email: normalizedEmail });
    if (!racedAdmin) throw error;
    await updateAdmin(racedAdmin, normalizedEmail, passwordHash);
    return { created: false };
  }
}

async function runSeed() {
  dotenv.config({ path: backendEnvPath });
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new AdminSeedConfigurationError("MONGODB_URI and a JWT_SECRET of at least 32 characters are required in backend/.env.");
  }

  validateCredentials(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const result = await syncAdminAccount({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });
  console.log(result.created
    ? "The configured YouthBiz Admin account was created."
    : "The configured YouthBiz Admin account was synchronized.");
}

if (import.meta.url === executedFile) {
  try {
    await runSeed();
  } catch (error) {
    if (error instanceof AdminSeedConfigurationError) console.error(error.message);
    else console.error("Admin seeding failed. Check backend configuration and database connectivity.");
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
}
