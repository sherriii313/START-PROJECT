import { Router } from "express";
import { Customer, Invoice, Order, Product } from "../models/index.js";
import { MONTHS, buckets, pct, periodRange, round, sum } from "../lib/stats.js";
import { wrap } from "../lib/http.js";
import { markOverdue } from "./resources.js";

const router = Router();
const pickOf = (v, list, d) => (list.includes(v) ? v : d);
const complete = (o) => o.filter((x) => x.status === "Complete");

// ---------- Dashboard ----------
router.get("/dashboard", wrap(async (req, res) => {
  const period = pickOf(req.query.period, ["today", "week", "month", "year"], "year");
  const popularP = pickOf(req.query.popular, ["today", "week", "month", "year"], "month");
  const range = pickOf(req.query.range, ["month", "year"], "month");
  const now = new Date();

  // KPI cards (this month vs last month)
  const m = periodRange("month", now);
  const m2 = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const three = await Order.find({ createdAt: { $gte: m2 } }).lean();
  const inR = (a, b) => three.filter((o) => o.createdAt >= a && (!b || o.createdAt < b));
  const cur = inR(m.start), prev = inR(m.prevStart, m.start), prev2 = inR(m2, m.prevStart);
  const rev = [sum(complete(cur)), sum(complete(prev)), sum(complete(prev2))];
  const growth = pct(rev[0], rev[1]), growthPrev = pct(rev[1], rev[2]);
  const [newC, newCPrev] = await Promise.all([
    Customer.countDocuments({ createdAt: { $gte: m.start } }),
    Customer.countDocuments({ createdAt: { $gte: m.prevStart, $lt: m.start } }),
  ]);
  const stats = [
    { label: "Total Revenue", value: round(rev[0]), change: pct(rev[0], rev[1]), format: "currency" },
    { label: "Orders", value: cur.length, change: pct(cur.length, prev.length), format: "number" },
    { label: "New Customers", value: newC, change: pct(newC, newCPrev), format: "number" },
    { label: "Growth Rate", value: growth, change: round(growth - growthPrev), format: "percent" },
  ];

  // Earning + order cards
  const rg = periodRange(range, now);
  const rgOrders = await Order.find({ createdAt: { $gte: rg.prevStart } }).lean();
  const rCur = rgOrders.filter((o) => o.createdAt >= rg.start), rPrev = rgOrders.filter((o) => o.createdAt < rg.start);
  const rb = buckets(range, now);
  const orderSeries = rb.labels.map(() => ({ v: 0 }));
  rCur.forEach((o) => { const i = rb.index(o.createdAt); if (orderSeries[i]) orderSeries[i].v += o.amount; });
  const earning = {
    total: round(sum(complete(rCur))), change: pct(sum(complete(rCur)), sum(complete(rPrev))),
    orderTotal: round(sum(rCur)), orderSeries,
    income: round(sum(complete(rCur))), expense: round(sum(rCur.filter((o) => o.status === "Cancel"))),
  };

  // Stacked revenue chart
  const p = periodRange(period, now);
  const pOrders = await Order.find({ createdAt: { $gte: p.start } }).lean();
  const b = buckets(period, now);
  const data = b.labels.map((label) => ({ label, complete: 0, pending: 0, cancel: 0 }));
  const keyOf = { Complete: "complete", Pending: "pending", Cancel: "cancel" };
  pOrders.forEach((o) => { const row = data[b.index(o.createdAt)]; if (row) row[keyOf[o.status]] = round(row[keyOf[o.status]] + o.amount); });
  const chart = {
    total: round(sum(complete(pOrders))),
    series: [{ key: "complete", label: "Completed" }, { key: "pending", label: "Pending" }, { key: "cancel", label: "Cancelled" }],
    data,
  };

  // Popular products
  const pp = periodRange(popularP, now);
  const ppOrders = (await Order.find({ createdAt: { $gte: pp.prevStart }, status: { $ne: "Cancel" } }).lean());
  const byProduct = {};
  ppOrders.forEach((o) => {
    const k = String(o.product);
    byProduct[k] ??= { cur: 0, prev: 0 };
    byProduct[k][o.createdAt >= pp.start ? "cur" : "prev"] += o.amount;
  });
  const top = Object.entries(byProduct).filter(([, v]) => v.cur > 0).sort((a, c) => c[1].cur - a[1].cur).slice(0, 5);
  const names = Object.fromEntries((await Product.find({ _id: { $in: top.map(([id]) => id) } }).select("name").lean()).map((x) => [String(x._id), x.name]));
  const popular = top.map(([id, v]) => {
    const c = pct(v.cur, v.prev);
    return { name: names[id] || "Deleted product", price: round(v.cur), changePct: Math.abs(c), trend: c >= 0 ? "up" : "down" };
  });

  const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(6).populate("customer", "name").populate("product", "name").lean();
  res.json({ stats, earning, chart, popular, recentOrders });
}));

// ---------- Analytics ----------
router.get("/analytics", wrap(async (req, res) => {
  const now = new Date();
  const m = periodRange("month", now);
  const yr = periodRange("year", now);
  const orders = await Order.find({ createdAt: { $gte: new Date(Math.min(+yr.start, +m.prevStart)) } }).lean();
  const cur = orders.filter((o) => o.createdAt >= m.start), prev = orders.filter((o) => o.createdAt >= m.prevStart && o.createdAt < m.start);
  const avg = (a) => (complete(a).length ? sum(complete(a)) / complete(a).length : 0);
  const active = (a) => new Set(a.map((o) => String(o.customer))).size;
  const conv = (a) => (a.length ? round((complete(a).length / a.length) * 100) : 0);
  const kpis = [
    { label: "Avg Order Value", value: round(avg(cur)), change: pct(avg(cur), avg(prev)), format: "money" },
    { label: "Total Orders", value: cur.length, change: pct(cur.length, prev.length), format: "number" },
    { label: "Active Customers", value: active(cur), change: pct(active(cur), active(prev)), format: "number" },
    { label: "Conversion Rate", value: conv(cur), change: round(conv(cur) - conv(prev)), format: "percent" },
  ];
  const revenue = MONTHS.map((label) => ({ label, revenue: 0 }));
  complete(orders.filter((o) => o.createdAt >= yr.start)).forEach((o) => { revenue[o.createdAt.getMonth()].revenue = round(revenue[o.createdAt.getMonth()].revenue + o.amount); });

  const counts = Object.fromEntries((await Order.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }])).map((x) => [x._id, x.n]));
  const orderStatus = {
    total: Object.values(counts).reduce((a, b) => a + b, 0),
    items: [{ name: "Completed", value: counts.Complete || 0 }, { name: "Pending", value: counts.Pending || 0 }, { name: "Cancelled", value: counts.Cancel || 0 }],
  };
  const countries = (await Customer.aggregate([
    { $match: { country: { $ne: "" } } }, { $group: { _id: "$country", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 },
  ])).map((x) => ({ country: x._id, count: x.count }));
  const tp = await Order.aggregate([
    { $match: { status: { $ne: "Cancel" } } },
    { $group: { _id: "$product", units: { $sum: "$qty" }, revenue: { $sum: "$amount" } } }, { $sort: { units: -1 } }, { $limit: 5 },
  ]);
  const names = Object.fromEntries((await Product.find({ _id: { $in: tp.map((x) => x._id) } }).select("name").lean()).map((x) => [String(x._id), x.name]));
  const topProducts = tp.map((x) => ({ name: names[String(x._id)] || "Deleted product", units: x.units, revenue: round(x.revenue) }));
  res.json({ kpis, revenue, orderStatus, countries, topProducts });
}));

// ---------- Invoice summary cards ----------
router.get("/invoices/summary", wrap(async (req, res) => {
  await markOverdue();
  const all = await Invoice.find().lean();
  const m = periodRange("month");
  const within = (list, a, b) => list.filter((i) => i.issued >= a && (!b || i.issued < b));
  const defs = [
    { label: "Outstanding", format: "money", f: (i) => ["Pending", "Overdue"].includes(i.status), val: (l) => sum(l) },
    { label: "Overdue", format: "money", f: (i) => i.status === "Overdue", val: (l) => sum(l) },
    { label: "Paid this month", format: "money", f: (i) => i.status === "Paid", val: (l) => sum(l), month: true },
    { label: "Drafts", format: "number", f: (i) => i.status === "Draft", val: (l) => l.length },
  ];
  const cards = defs.map((d) => {
    const list = all.filter(d.f);
    const value = d.month ? d.val(within(list, m.start)) : d.val(list);
    return { label: d.label, format: d.format, value: round(value), change: pct(d.val(within(list, m.start)), d.val(within(list, m.prevStart, m.start))) };
  });
  res.json({ cards });
}));

export default router;
