import Razorpay from "razorpay";
import User from "../models/User.js";
import { getCartItems } from "./cart.js";
import dotenv from "dotenv";

dotenv.config();

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

export const createOrder = async (
  finalAmount,
  userId,
  coinsUsed,
  billingAddressId,
  cartItems // Add cartItems parameter
) => {
  const options = {
    amount: finalAmount,
    currency: "INR",
    receipt: "receipt_order_" + new Date().getTime(),
    notes: {
      userId: userId.toString(),
      coinsUsed: coinsUsed.toString(),
      billingAddressId: billingAddressId.toString(),
      cartItems: JSON.stringify(cartItems), // Store cart items in notes
    },
  };
  const order = await razorpayInstance.orders.create(options);
  return order;
};

export const redeemCoinsService = async (userId, coinsToRedeem) => {
  if (typeof coinsToRedeem !== "number" || coinsToRedeem < 0) {
    throw new Error("Invalid coins input");
  }

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const cartItems = await getCartItems(userId);
  if (!cartItems || cartItems.length === 0) {
    throw new Error("Cart is empty");
  }

  const totalAmount = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const coinDiscount = Math.min(coinsToRedeem, user.coins, totalAmount);
  const payableAmount = totalAmount - coinDiscount;

  return { totalAmount, coinDiscount, payableAmount };
};

export const getRazorpayPaymentStatus = async (orderId) => {
  try {
    const payments = await razorpayInstance.orders.fetchPayments(orderId);

    if (!payments.items || payments.items.length === 0) {
      return { status: "pending" };
    }

    const latest = payments.items[payments.items.length - 1];

    return {
      status: latest.status,
      paymentId: latest.id,
      signature: null, // Optional: You can later verify if needed
    };
  } catch (error) {
    console.error("Error in getRazorpayPaymentStatus service:", error.message);
    throw error;
  }
};
