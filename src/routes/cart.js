import express from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
  updateCartQuantity,
} from "../controllers/cart.js";
import { authenticateUser } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authenticateUser, addToCart);
router.get("/", authenticateUser, getCart);
router.patch("/quantity", authenticateUser, updateCartQuantity);
router.delete("/:productId", authenticateUser, removeFromCart);

export default router;
