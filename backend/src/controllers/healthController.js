import mongoose from "mongoose";

export function getHealth(_request, response) {
  response.json({
    status: "ok",
    service: "YouthBiz API",
    database: mongoose.connection.readyState === 1 ? "connected" : "not connected",
  });
}