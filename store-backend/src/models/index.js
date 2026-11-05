import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema, model } = mongoose;
export const CATEGORIES = ["Electronics", "Accessories", "Furniture"];
const ref = (to, extra = {}) => ({ type: Schema.Types.ObjectId, ref: to, ...extra });

const userSchema = new Schema({
  name: { type: String, required: [true, "Name is required"], trim: true },
  email: { type: String, required: [true, "Email is required"], lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, "Enter a valid email"] },
  password: { type: String, required: [true, "Password is required"], minlength: [6, "Password must be at least 6 characters"], select: false },
  role: { type: String, enum: ["admin", "customer"], default: "customer" },
}, { timestamps: true });
userSchema.index({ email: 1, role: 1 }, { unique: true });
userSchema.pre("save", async function () {
  if (this.isModified("password")) this.password = await bcrypt.hash(this.password, 12);
});
userSchema.methods.matches = function (plain) { return bcrypt.compare(plain, this.password); };

const customerSchema = new Schema({
  code: { type: String, unique: true },
  name: { type: String, required: [true, "Name is required"], trim: true },
  email: { type: String, required: [true, "Email is required"], lowercase: true, trim: true },
  phone: { type: String, default: "" },
  country: { type: String, default: "" },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
}, { timestamps: true });

const productSchema = new Schema({
  name: { type: String, required: [true, "Product name is required"], trim: true },
  description: { type: String, default: "" },
  category: { type: String, enum: { values: CATEGORIES, message: "Pick a valid category" }, required: [true, "Category is required"] },
  price: { type: Number, required: [true, "Price is required"], min: [0, "Price cannot be negative"] },
  stock: { type: Number, default: 0, min: [0, "Stock cannot be negative"] },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviews: { type: Number, default: 0, min: 0 },
  image: { type: String, default: "" },
}, { timestamps: true });

const orderSchema = new Schema({
  code: { type: String, unique: true },
  customer: ref("Customer", { required: true }),
  product: ref("Product", { required: true }),
  branch: { type: String, default: "" },
  payment: { type: String, enum: ["Card", "UPI", "COD"], default: "COD" },
  qty: { type: Number, required: true, min: 1 },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["Complete", "Pending", "Cancel"], default: "Pending" },
}, { timestamps: true });

const invoiceSchema = new Schema({
  code: { type: String, unique: true },
  customer: ref("Customer", { required: [true, "Customer is required"] }),
  order: ref("Order", { default: null }),
  issued: { type: Date, default: Date.now },
  due: { type: Date, required: [true, "Due date is required"] },
  amount: { type: Number, required: [true, "Amount is required"], min: 0 },
  status: { type: String, enum: ["Pending", "Overdue", "Paid", "Draft"], default: "Pending" },
}, { timestamps: true });

const billingSchema = new Schema({
  user: ref("User", { required: true, unique: true }),
  plan: { type: new Schema({ name: String, since: Date }, { _id: false }), default: null },
  card: { type: new Schema({ brand: String, last4: String, expires: String }, { _id: false }), default: null },
  history: [{ description: String, date: Date, amount: Number, status: { type: String, enum: ["Paid", "Failed"] } }],
}, { timestamps: true });

const counterSchema = new Schema({ _id: String, seq: { type: Number, default: 0 } });

export const User = model("User", userSchema);
export const Customer = model("Customer", customerSchema);
export const Product = model("Product", productSchema);
export const Order = model("Order", orderSchema);
export const Invoice = model("Invoice", invoiceSchema);
export const Billing = model("Billing", billingSchema);
export const Counter = model("Counter", counterSchema);

export async function nextCode(key, prefix, start) {
  const c = await Counter.findOneAndUpdate({ _id: key }, { $inc: { seq: 1 } }, { upsert: true, new: true });
  return `${prefix}-${start + c.seq}`;
}
