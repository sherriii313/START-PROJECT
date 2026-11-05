import { Router } from "express";
import { guard } from "../middleware/auth.js";
import { CATEGORIES, Customer, Order, Product, nextCode } from "../models/index.js";
import { HttpError, escapeRe, wrap } from "../lib/http.js";

const router = Router();
const adapt = (p) => ({ ...p, category: { _id: p.category, name: p.category } }); // shape expected by the customer frontend

router.get("/categories", (req, res) => res.json(CATEGORIES.map((c) => ({ _id: c, name: c }))));

router.get("/products", wrap(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(req.query.limit) || 8));
  const filter = {};
  if (CATEGORIES.includes(req.query.category)) filter.category = req.query.category;
  if (req.query.search) filter.name = { $regex: escapeRe(String(req.query.search)), $options: "i" };
  const [items, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Product.countDocuments(filter),
  ]);
  res.json({ products: items.map(adapt), page, pages: Math.max(1, Math.ceil(total / limit)), total });
}));

router.get("/products/:id", wrap(async (req, res) => {
  const p = await Product.findById(req.params.id).lean();
  if (!p) throw new HttpError(404, "Product not found");
  res.json(adapt(p));
}));

const customerFor = async (user) =>
  (await Customer.findOne({ email: user.email })) ||
  Customer.create({ code: await nextCode("customer", "CUST", 1000), name: user.name, email: user.email });

router.post("/orders", guard("customer"), wrap(async (req, res) => {
  const { items, shippingAddress: a } = req.body;
  if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, "Your cart is empty");
  if (!a?.fullName || !a.phone || !a.address || !a.city) throw new HttpError(400, "Delivery details are incomplete");

  const lines = [];
  for (const it of items) {
    const qty = Number(it.qty);
    const product = await Product.findById(it.product);
    if (!product) throw new HttpError(400, "A product in your cart no longer exists");
    if (!Number.isInteger(qty) || qty < 1) throw new HttpError(400, "Quantity must be 1 or more");
    if (product.stock < qty) throw new HttpError(400, `Only ${product.stock} left of ${product.name}`);
    lines.push({ product, qty });
  }
  const customer = await customerFor(req.user);
  customer.phone = a.phone;
  customer.country ||= a.city;
  await customer.save();

  const created = [];
  for (const { product, qty } of lines) {
    const r = await Product.updateOne({ _id: product._id, stock: { $gte: qty } }, { $inc: { stock: -qty } });
    if (!r.modifiedCount) throw new HttpError(400, `${product.name} just sold out`);
    created.push(await Order.create({
      code: await nextCode("order", "ORD", 7000), customer: customer._id, product: product._id,
      branch: a.city, payment: "COD", qty, amount: product.price * qty, status: "Pending",
    }));
  }
  res.status(201).json({ orders: created });
}));

router.get("/orders/mine", guard("customer"), wrap(async (req, res) => {
  const customer = await Customer.findOne({ email: req.user.email });
  if (!customer) return res.json([]);
  const orders = await Order.find({ customer: customer._id }).sort({ createdAt: -1 }).populate("product", "name").lean();
  res.json(orders.map((o) => ({
    _id: o._id, code: o.code, items: [{ _id: o._id, name: o.product?.name || "Removed product", qty: o.qty }],
    total: o.amount, status: o.status, createdAt: o.createdAt,
  })));
}));
export default router;
