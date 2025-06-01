import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary } from "../config/cloudinary.js";

import {
  addProduct,
  getProductById,
  getProducts,
} from "../controllers/products.js";
import { authenticateUser } from "../middleware/auth.js";

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "products",
    allowedFormats: ["jpg", "jpeg", "png"],
  },
});

const upload = multer({ storage });

router.post("/", authenticateUser, upload.single("image"), addProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);

export default router;
