import express from "express";
import {
  createOrder,
  downloadInvoice,
  getOrders,
} from "../controllers/order.js";
import { authenticateUser } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authenticateUser, createOrder);
router.get("/", authenticateUser, getOrders);

router.get("/:id/invoice", downloadInvoice);

export default router;
