import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";

const port = Number(process.env.PORT) || 4000;
let server;

async function startServer() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error("MONGODB_URI and a JWT_SECRET of at least 32 characters are required.");
    process.exitCode = 1;
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log("Connected to MongoDB");
    server = app.listen(port, () => {
      console.log(`YouthBiz API listening on http://localhost:${port}`);
    });
  } catch {
    console.error("MongoDB connection failed. Check Atlas network access and backend configuration; secret values were not logged.");
    await mongoose.disconnect();
    process.exitCode = 1;
  }
}

async function shutdown() {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer();