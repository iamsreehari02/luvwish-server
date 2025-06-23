import User from "../models/User.js";
import { isKerala } from "../utils/isKerala.js";
import { calculateShippingCharge } from "../utils/shippingChargeCalculator.js";
import { getCartItems } from "./cart.js";

export const calculateBillingAmount = async (userId, state, coinsUsed = 0) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const cartItems = await getCartItems(userId);
  if (!cartItems || cartItems.length === 0) throw new Error("Cart is empty");

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const isKeralaLocation = isKerala({ state });
  const shippingCharge = calculateShippingCharge(cartItems, isKeralaLocation);

  const maxCoinsAllowed = Math.min(user.coins, cartTotal + shippingCharge);
  if (coinsUsed > maxCoinsAllowed) {
    throw new Error("You cannot redeem more coins than allowed");
  }

  const finalAmount = cartTotal + shippingCharge - coinsUsed;

  return {
    shippingCharge,
    cartTotal,
    coinDiscount: coinsUsed,
    payableAmount: finalAmount,
  };
};
