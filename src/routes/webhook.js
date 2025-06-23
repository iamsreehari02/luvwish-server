import express from "express";
import { handleRazorpayWebhook } from "../controllers/payment.js";

const router = express.Router();

// router.post(
//   "/webhook",
//   express.json({
//     verify: (req, res, buf) => {
//       req.rawBody = buf;
//     },
//   }),
//   handleRazorpayWebhook
// );

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleRazorpayWebhook
);

export default router;
