import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import businessIdeaRoutes from "./routes/businessIdeaRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import healthRoutes from "./routes/healthRoutes.js";
import { allowedOrigins } from "./config/origins.js";

const app = express();

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/ideas", businessIdeaRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/progress", progressRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;