import express from "express";
import { authenticateUser } from "../middleware/auth.js";
import { calculateBillingAmountHandler } from "../controllers/billing.js";

const router = express.Router();

router.post("/", authenticateUser, calculateBillingAmountHandler);

export default router;
