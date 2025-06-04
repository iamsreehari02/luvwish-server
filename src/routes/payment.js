import express from "express";
import {
  createRazorpayOrder,
  verifyPaymentAndPlaceOrder,
} from "../controllers/payment.js";
import { authenticateUser } from "../middleware/auth.js";

const router = express.Router();

router.post("/", createRazorpayOrder);
router.post("/verify", authenticateUser, verifyPaymentAndPlaceOrder);

export default router;
