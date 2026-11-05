import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { HttpError, wrap } from "../lib/http.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => (file.mimetype.startsWith("image/") ? cb(null, true) : cb(new HttpError(400, "Only image files are allowed"))),
});
const router = Router();

router.post("/", upload.single("image"), wrap(async (req, res) => {
  if (!req.file) throw new HttpError(400, "Choose an image to upload");
  if (!process.env.CLOUDINARY_CLOUD_NAME) throw new HttpError(500, "Image storage is not configured on the server");
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
  const url = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder: "store-products" }, (err, r) => (err ? reject(err) : resolve(r.secure_url))).end(req.file.buffer);
  });
  res.status(201).json({ url });
}));
export default router;
