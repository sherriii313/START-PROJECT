import { Router } from "express";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { COOKIES } from "../config/passport.js";
import { guard } from "../middleware/auth.js";
import { Customer, User, nextCode } from "../models/index.js";
import { HttpError, pick, wrap } from "../lib/http.js";

const prod = process.env.NODE_ENV === "production";
const cookieOpts = { httpOnly: true, secure: prod, sameSite: prod ? "none" : "lax", maxAge: 7 * 864e5 };
const publicUser = (u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role });
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, message: { message: "Too many attempts. Try again in a few minutes." } });

// Builds /register /login /logout /me for one role (admin dashboard or customer shop).
export default function authRouter(role) {
  const r = Router();
  const cookie = COOKIES[role];
  const sign = (res, user) => res.cookie(cookie, jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" }), cookieOpts);

  r.post("/register", limiter, wrap(async (req, res) => {
    if (role === "admin" && process.env.ALLOW_ADMIN_SIGNUP === "false") throw new HttpError(403, "Admin sign up is disabled");
    const { name, email, password } = req.body;
    if (await User.exists({ email: String(email || "").toLowerCase(), role })) throw new HttpError(409, "An account with this email already exists");
    const user = await User.create({ name, email, password, role });
    if (role === "customer" && !(await Customer.exists({ email: user.email }))) {
      await Customer.create({ code: await nextCode("customer", "CUST", 1000), name: user.name, email: user.email });
    }
    sign(res, user);
    res.status(201).json({ user: publicUser(user) });
  }));

  r.post("/login", limiter, wrap(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || "").toLowerCase(), role }).select("+password");
    if (!user || !(await user.matches(String(password || "")))) throw new HttpError(401, "Wrong email or password");
    sign(res, user);
    res.json({ user: publicUser(user) });
  }));

  r.post("/logout", (req, res) => { res.clearCookie(cookie, { ...cookieOpts, maxAge: undefined }); res.json({ ok: true }); });

  r.get("/me", guard(role), (req, res) => res.json({ user: publicUser(req.user) }));

  r.put("/me", guard(role), wrap(async (req, res) => {
    const user = await User.findById(req.user._id).select("+password");
    const { name, email, password } = pick(req.body, ["name", "email", "password"]);
    if (email && email.toLowerCase() !== user.email && (await User.exists({ email: email.toLowerCase(), role }))) throw new HttpError(409, "That email is already in use");
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;
    await user.save();
    res.json({ user: publicUser(user) });
  }));
  return r;
}
