import express from "express";
import {
  signup,
  signin,
  logout,
  sendOtpHandler,
  verifyOtpHandler,
  resetPasswordHandler,
} from "../controllers/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/logout", logout);

router.post("/otp", sendOtpHandler);
router.post("/otp/verify", verifyOtpHandler);
router.post("/reset-password", resetPasswordHandler);

export default router;
