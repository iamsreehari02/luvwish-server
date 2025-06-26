import express from "express";
import {
  createRazorpayOrder,
  getPaymentStatus,
  redeemCoins,
  verifyPaymentAndPlaceOrder,
} from "../controllers/payment.js";
import { authenticateUser } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authenticateUser, createRazorpayOrder);
// router.post("/verify", authenticateUser, verifyPaymentAndPlaceOrder);
router.post("/redeem", authenticateUser, redeemCoins);
router.get("/status/:orderId", getPaymentStatus);

export default router;
