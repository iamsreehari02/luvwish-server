import Cart from "../models/Cart.js";

export const clearUserCart = async (userId) => {
  try {
    await Cart.deleteMany({ user: userId });

    console.log(`Cart cleared for user: ${userId}`);
  } catch (error) {
    console.error("Error clearing cart:", error);
    throw error;
  }
};
