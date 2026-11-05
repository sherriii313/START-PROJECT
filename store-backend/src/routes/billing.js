import { Router } from "express";
import { Billing } from "../models/index.js";
import { HttpError, wrap } from "../lib/http.js";

export const PLANS = [
  { name: "Starter", price: 19, features: ["Up to 100 orders a month", "2 team seats", "Email support"] },
  { name: "Pro", price: 49, features: ["Unlimited orders and invoices", "10 team seats", "Priority support"] },
  { name: "Business", price: 99, features: ["Unlimited orders and invoices", "50 team seats", "Dedicated account manager"] },
];
const router = Router();
const mine = (user) => Billing.findOneAndUpdate({ user: user._id }, { $setOnInsert: { user: user._id } }, { upsert: true, new: true });

const view = (b) => {
  const plan = b.plan && PLANS.find((p) => p.name === b.plan.name);
  return {
    plan: plan ? { name: plan.name, price: plan.price, features: plan.features, status: "Active" } : null,
    plans: PLANS, card: b.card || null,
    history: [...b.history].sort((a, c) => c.date - a.date),
  };
};

router.get("/", wrap(async (req, res) => res.json(view(await mine(req.user)))));

router.put("/plan", wrap(async (req, res) => {
  const plan = PLANS.find((p) => p.name === req.body.plan);
  if (!plan) throw new HttpError(400, "Choose a valid plan");
  const b = await mine(req.user);
  if (!b.card) throw new HttpError(400, "Add a payment card before choosing a plan");
  b.plan = { name: plan.name, since: new Date() };
  const month = new Date().toLocaleString("en-US", { month: "long" });
  b.history.push({ description: `${plan.name} plan — ${month}`, date: new Date(), amount: plan.price, status: "Paid" });
  await b.save();
  res.json(view(b));
}));

router.post("/cancel", wrap(async (req, res) => {
  const b = await mine(req.user);
  b.plan = null;
  await b.save();
  res.json(view(b));
}));

router.put("/card", wrap(async (req, res) => {
  const { brand, last4, expires } = req.body;
  if (!["Visa", "Mastercard", "Amex"].includes(brand)) throw new HttpError(400, "Choose a card brand");
  if (!/^\d{4}$/.test(last4 || "")) throw new HttpError(400, "Enter a valid card number");
  const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(expires || "");
  if (!m) throw new HttpError(400, "Expiry must look like 12/29");
  if (new Date(2000 + Number(m[2]), Number(m[1]), 0, 23, 59) < new Date()) throw new HttpError(400, "This card has expired");
  const b = await mine(req.user);
  b.card = { brand, last4, expires };   // never store the full number
  await b.save();
  res.json(view(b));
}));

export default router;
