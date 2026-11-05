import "dotenv/config";
import mongoose from "mongoose";

for (const k of ["MONGO_URI", "JWT_SECRET"]) {
  if (!process.env[k]) { console.error(`Missing ${k} in environment`); process.exit(1); }
}
const { default: app } = await import("./app.js");

await mongoose.connect(process.env.MONGO_URI);
console.log("MongoDB connected");
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API running on port ${port}`));
