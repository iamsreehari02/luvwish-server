import express from "express";
import {
  signup,
  signin,
  logout,
  sendOtpHandler,
  verifyOtpHandler,
  resetPasswordHandler,
  getLoggedInUser,
} from "../controllers/auth.js";
import { authenticateUser } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/logout", logout);

router.get("/me", authenticateUser, getLoggedInUser);

router.post("/otp", sendOtpHandler);
router.post("/otp/verify", verifyOtpHandler);
router.post("/reset-password", resetPasswordHandler);

export default router;
