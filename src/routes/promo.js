import express from "express";
import { handlePromoSubscription } from "../controllers/promo.js";
import { authenticateUser } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authenticateUser, handlePromoSubscription);

export default router;
