import express from "express";
import {
  signup,
  signin,
  logout,
  sendOtpHandler,
  verifyOtpHandler,
  resetPasswordHandler,
  getLoggedInUser,
  getAllUsers,
  softDeleteUser,
} from "../controllers/auth.js";
import { authenticateUser } from "../middleware/auth.js";
import { authorizeAdmin } from "../middleware/authorizeAdmin.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/logout", logout);

router.get("/me", authenticateUser, getLoggedInUser);

router.post("/otp", sendOtpHandler);
router.post("/otp/verify", verifyOtpHandler);
router.post("/reset-password", resetPasswordHandler);

router.get("/users", authenticateUser, authorizeAdmin, getAllUsers);
router.delete("/users/:id", authenticateUser, authorizeAdmin, softDeleteUser);

export default router;
