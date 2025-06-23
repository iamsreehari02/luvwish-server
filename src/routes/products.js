import express from "express";
import {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  softDeleteProduct,
} from "../controllers/products.js";
import { authenticateUser } from "../middleware/auth.js";
import { authorizeAdmin } from "../middleware/authorizeAdmin.js";
import upload from "../middleware/multer.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProductById);

router.post(
  "/",
  authenticateUser,
  authorizeAdmin,
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "additionalImages" },
  ]),
  addProduct
);

router.patch(
  "/:id",
  authenticateUser,
  authorizeAdmin,
  upload.single("image"),
  updateProduct
);
router.delete("/:id", authenticateUser, authorizeAdmin, softDeleteProduct);

export default router;
