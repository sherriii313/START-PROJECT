
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "./config/passport.js";
import authRouter from "./routes/authRouter.js";
import resources from "./routes/resources.js";
import insights from "./routes/insights.js";
import billing from "./routes/billing.js";
import upload from "./routes/upload.js";
import shop from "./routes/shop.js";
import { guard } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/error.js";

const app = express();
app.set("trust proxy", 1); // Render/Vercel sit in front of us

// Access log written with the Node file system module


const origins = (process.env.CLIENT_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
app.use(helmet());
app.use(cors({ origin: (o, cb) => cb(null, !o || origins.includes(o)), credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(passport.initialize());

app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Customer shop: public catalogue + customer-only orders
app.use("/api/auth", authRouter("customer"));
app.use("/api/shop", shop);

// Admin dashboard: everything below requires an admin session
app.use("/api/admin/auth", authRouter("admin"));
const admin = guard("admin");
app.use("/api/upload", admin, upload);
app.use("/api/billing", admin, billing);
app.use("/api", admin, insights);
app.use("/api", admin, resources);

app.use(notFound);
app.use(errorHandler);
export default app;
