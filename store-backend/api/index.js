import mongoose from "mongoose";
import app from "../src/app.js";

let connectionPromise;

export default async function handler(req, res) {
  try {
    if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
      return res.status(500).json({
        error: "Environment variables missing"
      });
    }

    if (mongoose.connection.readyState !== 1) {
      connectionPromise ??= mongoose.connect(process.env.MONGO_URI);
      await connectionPromise;
    }

    return app(req, res);
  } catch (error) {
    console.error("Backend initialization failed:", error.name);

    const safeMessage = String(error.message || "Unknown error")
      .replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi, "[DATABASE URL HIDDEN]")
      .replace(/(password|passwd)=([^&\s]+)/gi, "$1=[HIDDEN]");

    return res.status(500).json({
      error: "Backend initialization failed",
      type: error.name,
      detail: safeMessage
    });
  }
}