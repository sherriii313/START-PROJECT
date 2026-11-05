import "dotenv/config";
import mongoose from "mongoose";
import { Customer, Invoice, Order, Product, User, nextCode } from "../models/index.js";

const sample = process.argv.includes("--sample");
await mongoose.connect(process.env.MONGO_URI);

// 1) Admin account (always)
const email = (process.env.SEED_ADMIN_EMAIL || "admin@lumen.com").toLowerCase();
if (!(await User.exists({ email, role: "admin" }))) {
  await User.create({ name: process.env.SEED_ADMIN_NAME || "Store Owner", email, password: process.env.SEED_ADMIN_PASSWORD || "Admin@12345", role: "admin" });
  console.log(`Admin created: ${email}`);
} else console.log(`Admin already exists: ${email}`);

// 2) Optional starter data so a fresh dashboard is not empty
if (sample) {
  if (await Product.exists({})) { console.log("Data already present, skipping sample data"); process.exit(0); }
  let s = 42; const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const pickOne = (a) => a[Math.floor(rnd() * a.length)];

  const products = await Product.insertMany([
    ["Canon EOS 1500D", "SLR camera, black, EF S18-55mm", "Electronics", 549, 25, 4.3, 13],
    ["Apple MacBook Pro", "14-inch, M3 chip, 512GB", "Electronics", 1999, 12, 4.0, 15],
    ["Centrix Gold Watch", "Couple watch, refurbished", "Accessories", 212, 6, 4.1, 30],
    ["Fitbit MX30", "Waterproof smart watch", "Accessories", 89, 0, 4.6, 50],
    ["Wireless Headset Pro", "Noise cancelling, over-ear", "Electronics", 189, 40, 4.4, 22],
    ["Mechanical Keyboard", "Hot-swappable, RGB", "Accessories", 142.5, 30, 4.2, 18],
    ["Ergo Chair", "Mesh back, lumbar support", "Furniture", 489, 8, 4.5, 27],
    ["Desk Lamp LED", "Adjustable, touch control", "Furniture", 39, 60, 3.9, 9],
  ].map(([name, description, category, price, stock, rating, reviews]) => ({ name, description, category, price, stock, rating, reviews })));

  const people = [["Caroline Pandolfi", "United States"], ["Liam Smith", "United States"], ["Emma Johnson", "Canada"], ["Noah Brown", "United Kingdom"],
    ["Olivia Davis", "United States"], ["William Miller", "Canada"], ["Sophia Wilson", "United States"], ["James Moore", "United Kingdom"],
    ["Isabella Taylor", "Canada"], ["Benjamin Anderson", "United States"], ["Amara Ibrahim", "Nigeria"], ["Daniel Kwon", "Canada"]];
  const customers = [];
  for (const [i, [name, country]] of people.entries()) {
    customers.push(await Customer.create({
      code: await nextCode("customer", "CUST", 1000), name, email: `${name.split(" ")[0].toLowerCase()}${i + 1}@example.com`,
      phone: `555${String(1000000 + i * 7919).slice(0, 7)}`, country, status: i % 4 === 3 ? "Inactive" : "Active",
    }));
  }

  const now = Date.now();
  for (let i = 0; i < 48; i++) {
    const product = pickOne(products), customer = pickOne(customers), qty = 1 + Math.floor(rnd() * 3);
    const created = new Date(now - Math.floor(Math.pow(rnd(), 1.6) * 330) * 864e5);
    const status = pickOne(["Complete", "Complete", "Complete", "Pending", "Cancel"]);
    const order = await Order.create({
      code: await nextCode("order", "ORD", 7000), customer: customer._id, product: product._id, qty, amount: product.price * qty,
      branch: pickOne(["USA", "Canada", "India", "UK", "Australia"]), payment: pickOne(["Card", "UPI", "COD"]), status, createdAt: created, updatedAt: created,
    });
    if (status !== "Cancel" && rnd() > 0.4) {
      await Invoice.create({
        code: await nextCode("invoice", "INV", 1000), customer: customer._id, order: order._id, issued: created,
        due: new Date(+created + 14 * 864e5), amount: order.amount, status: status === "Complete" ? "Paid" : "Pending",
      });
    }
  }
  console.log("Sample products, customers, orders and invoices created");
}
await mongoose.disconnect();
