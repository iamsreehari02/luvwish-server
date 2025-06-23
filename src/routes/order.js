import express from "express";
import {
  createOrder,
  downloadInvoice,
  getAllOrders,
  getOrders,
} from "../controllers/order.js";
import { authenticateUser } from "../middleware/auth.js";
import { authorizeAdmin } from "../middleware/authorizeAdmin.js";

const router = express.Router();

router.post("/", authenticateUser, createOrder);
router.get("/", authenticateUser, getOrders);

router.get("/:id/invoice", authenticateUser, downloadInvoice);

router.get("/admin/orders", authenticateUser, authorizeAdmin, getAllOrders);

export default router;
