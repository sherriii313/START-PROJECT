import { Router } from "express";
import crud from "./crud.js";
import { Customer, Invoice, Order, Product, CATEGORIES } from "../models/index.js";
import { HttpError, pick } from "../lib/http.js";

const router = Router();

// ---------- Customers ----------
router.use("/customers", crud(Customer, {
  fields: ["name", "email", "phone", "country", "status"],
  search: ["name", "email", "phone", "country", "code"], filters: ["status"],
  key: "customer", prefix: "CUST", start: 1000,
  remove: async (c) => { if (await Order.exists({ customer: c._id })) throw new HttpError(409, "This customer has orders and cannot be deleted"); },
}));

// ---------- Products ----------
router.use("/products", crud(Product, {
  fields: ["name", "description", "category", "price", "stock", "rating", "reviews", "image"],
  search: ["name", "description"], filters: ["category"],
  sorts: { newest: { createdAt: -1 }, price_asc: { price: 1 }, price_desc: { price: -1 } },
  remove: async (p) => { if (await Order.exists({ product: p._id })) throw new HttpError(409, "This product has orders and cannot be deleted"); },
}));
router.get("/meta/categories", (req, res) => res.json(CATEGORIES));

// ---------- Orders (amount is always computed on the server; stock is kept in sync) ----------
const effect = (o) => (o.status === "Cancel" ? 0 : o.qty);
const give = (id, qty) => qty && Product.updateOne({ _id: id }, { $inc: { stock: qty } });
async function take(id, qty) {
  if (!qty) return;
  const r = await Product.updateOne({ _id: id, stock: { $gte: qty } }, { $inc: { stock: -qty } });
  if (!r.modifiedCount) throw new HttpError(400, "Not enough stock for this order");
}
async function build(body, existing) {
  const product = await Product.findById(body.product ?? existing?.product);
  if (!product) throw new HttpError(400, "Product not found");
  if (!(await Customer.exists({ _id: body.customer ?? existing?.customer }))) throw new HttpError(400, "Customer not found");
  const qty = Number(body.qty ?? existing?.qty);
  if (!Number.isInteger(qty) || qty < 1) throw new HttpError(400, "Quantity must be a whole number, 1 or more");
  const same = existing && String(existing.product) === String(product._id) && existing.qty === qty;
  return { ...pick(body, ["customer", "branch", "payment", "status"]), product: product._id, qty, amount: same ? existing.amount : product.price * qty };
}
router.use("/orders", crud(Order, {
  fields: [], search: ["code", "branch", "payment"], searchRefs: [{ field: "customer", Model: Customer, fields: ["name"] }],
  filters: ["status"], populate: [{ path: "customer", select: "name" }, { path: "product", select: "name" }],
  key: "order", prefix: "ORD", start: 7000,
  create: async (body) => { const d = await build(body); await take(d.product, effect(d)); return d; },
  update: async (doc, body) => {
    const d = await build(body, doc);
    await give(doc.product, effect(doc));
    try { await take(d.product, effect(d)); } catch (e) { await take(doc.product, effect(doc)); throw e; }
    return d;
  },
  remove: async (doc) => { await give(doc.product, effect(doc)); },
}));

// ---------- Invoices ----------
export const markOverdue = () => Invoice.updateMany({ status: "Pending", due: { $lt: new Date() } }, { status: "Overdue" });
const invFields = ["customer", "issued", "due", "amount", "status"];
const withOrder = (body, d) => { if ("order" in body) d.order = body.order || null; return d; };
router.use("/invoices", crud(Invoice, {
  fields: invFields, search: ["code"], searchRefs: [{ field: "customer", Model: Customer, fields: ["name"] }],
  filters: ["status"], populate: [{ path: "customer", select: "name" }, { path: "order", select: "code" }],
  key: "invoice", prefix: "INV", start: 1000, beforeList: markOverdue,
  create: async (body) => withOrder(body, pick(body, invFields)),
  update: async (doc, body) => withOrder(body, pick(body, invFields)),
}));

export default router;
