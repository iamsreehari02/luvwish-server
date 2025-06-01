import Otp from "../models/Otp.js";
import User from "../models/User.js";
import { sendResetOtpEmail } from "../utils/email/sendResetOtpEmail.js";
import { generateToken } from "../utils/generateToken.js";
import { generateOtp } from "../utils/generatOtp.js";

export const registerUser = async ({ email, name, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error("Email already exists");

  const userData = { email, name };

  if (!password || password.trim() === "") {
    throw new Error("Password is required for local provider");
  }
  userData.password = password;

  const user = new User({ email, password, name });
  await user.save();
  const token = generateToken(user._id, user.role);
  return { user, token };
};

export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new Error("Invalid credentials");

  const token = generateToken(user._id, user.role);
  return { user, token };
};

export const sendResetOtp = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("No user found with this email");

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  await Otp.findOneAndUpdate(
    { email },
    { otp, expiresAt },
    { upsert: true, new: true }
  );

  await sendResetOtpEmail(email, otp);
};

export const verifyOtp = async ({ email, otp }) => {
  const otpEntry = await Otp.findOne({ email });
  if (!otpEntry || otpEntry.otp !== otp) {
    throw new Error("Invalid OTP");
  }

  if (otpEntry.expiresAt < new Date()) {
    throw new Error("OTP has expired");
  }

  otpEntry.verified = true;
  await otpEntry.save();

  return true;
};

export const resetPassword = async ({ email, newPassword }) => {
  const otpEntry = await Otp.findOne({ email });
  if (!otpEntry || !otpEntry.verified) {
    throw new Error("OTP verification required");
  }

  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  user.password = newPassword;
  await user.save();

  await Otp.deleteOne({ email });
};
