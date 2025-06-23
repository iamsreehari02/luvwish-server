import express from "express";
import productRoutes from "./products.js";
import cartRoutes from "./cart.js";
import userRoutes from "./user.js";
import orderRoutes from "./order.js";
import promoRoutes from "./promo.js";
import authRoutes from "./auth.js";
import paymentRoutes from "./payment.js";
import contactMessageRoutes from "./contactMessage.js";
import contactUsRoutes from "./contact.js";
import billingRoutes from "./billing.js";

const router = express.Router();

router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/user", userRoutes);
router.use("/orders", orderRoutes);
router.use("/promo", promoRoutes);
router.use("/auth", authRoutes);
router.use("/payment", paymentRoutes);
router.use("/contact-message", contactMessageRoutes);
router.use("/contact-us", contactUsRoutes);
router.use("/billing", billingRoutes);

export default router;
