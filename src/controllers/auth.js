import {
  registerUser,
  loginUser,
  sendResetOtp,
  verifyOtp,
  resetPassword,
  getUserById,
} from "../services/auth.js";
import { setAuthCookie } from "../utils/cookies.js";

export const signup = async (req, res) => {
  try {
    const { email, name, password } = req.body;
    const { user, token } = await registerUser({
      email,
      name,
      password,
    });

    setAuthCookie(res, token);

    res.status(201).json({ message: "User registered", user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await loginUser({ email, password });

    setAuthCookie(res, token);

    res.status(200).json({ message: "Login successful", user });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

export const getLoggedInUser = async (req, res) => {
  try {
    const user = await getUserById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("authToken").status(200).json({ message: "Logged out" });
};

export const sendOtpHandler = async (req, res) => {
  try {
    const { email } = req.body;
    await sendResetOtp(email);
    res.status(200).json({ message: "OTP sent to your email" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const verifyOtpHandler = async (req, res) => {
  try {
    const { email, otp } = req.body;
    await verifyOtp({ email, otp });
    res.status(200).json({ message: "OTP verified" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const resetPasswordHandler = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    await resetPassword({ email, newPassword });
    res.status(200).json({ message: "Password has been reset" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
