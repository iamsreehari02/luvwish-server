import Order from "../models/Order.js";
import Address from "../models/Address.js";
import Cart from "../models/Cart.js";
import User from "../models/User.js";
import { generateOrderNumber } from "../utils/generateOrderNumber.js";
import { getCartItems } from "./cart.js";
import { clearUserCart } from "../utils/clearCart.js";

// export const placeOrder = async (
//   userId,
//   billingData,
//   shippingCharge,
//   grandTotal,
//   coinsUsed
// ) => {
//   const user = await User.findById(userId);
//   const cart = await Cart.findOne({ user: userId }).populate("items.product");

//   if (!cart || cart.items.length === 0) {
//     throw new Error("Cart is empty");
//   }

//   const billingAddress = await Address.create({ ...billingData, user: userId });

//   const order = await Order.create({
//     user: userId,
//     orderNumber: generateOrderNumber(),
//     items: cart.items.map((item) => ({
//       product: item.product._id,
//       quantity: item.quantity,
//       price: item.product.price,
//     })),
//     billingAddress: billingAddress._id,
//     totalAmount: grandTotal,
//     shippingCharge: shippingCharge,
//     coinsUsed: coinsUsed,
//     title: billingData.title,
//     phoneNumber: billingData.phoneNumber,
//     email: billingData.email || user.email,
//   });

//   // Empty cart
//   await Cart.deleteOne({ user: userId });

//   return order;
// };

// export const placeOrder = async (userId, billingAddressId, shippingCharge) => {
//   try {
//     // Get the existing address - don't create a new one
//     const billingAddress = await Address.findById(billingAddressId);
//     if (!billingAddress) {
//       throw new Error(`Billing address not found: ${billingAddressId}`);
//     }

//     // Get user details
//     const user = await User.findById(userId);
//     if (!user) {
//       throw new Error(`User not found: ${userId}`);
//     }

//     // Get cart items
//     const cartItems = await getCartItems(userId);
//     if (!cartItems || cartItems.length === 0) {
//       throw new Error("Cart is empty");
//     }

//     // Create the order
//     const order = new Order({
//       user: userId,
//       email: user.email, // Use user's email
//       billingAddress: billingAddressId, // Reference the existing address

//       phoneNumber: billingAddress.phoneNumber,
//       title: billingAddress.title,
//       orderNumber: generateOrderNumber(),

//       items: cartItems.map((item) => ({
//         product: item.productId,
//         quantity: item.quantity,
//         price: item.price,
//       })),
//       shippingCharge: shippingCharge,
//       totalAmount: cartItems.reduce(
//         (total, item) => total + item.price * item.quantity,
//         0
//       ),
//       status: "pending", // Will be updated to 'completed' after payment verification
//       createdAt: new Date(),
//     });

//     const savedOrder = await order.save();

//     // Clear the user's cart after creating order
//     await clearUserCart(userId);

//     return savedOrder;
//   } catch (error) {
//     console.error("Error in placeOrder:", error);
//     throw error;
//   }
// };

export const placeOrder = async (
  userId,
  billingAddressId,
  shippingCharge,
  session = null,
  coinsUsed = 0,
  paymentStatus = "pending"
) => {
  try {
    const billingAddress = await Address.findById(billingAddressId);
    if (!billingAddress) {
      throw new Error(`Billing address not found: ${billingAddressId}`);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const cartItems = await getCartItems(userId);
    if (!cartItems || cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    const cartTotal = cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Final total:
    const finalTotal = cartTotal + shippingCharge - coinsUsed;

    const order = new Order({
      user: userId,
      email: user.email,
      billingAddress: billingAddressId,
      phoneNumber: billingAddress.phoneNumber,
      title: billingAddress.title,
      orderNumber: generateOrderNumber(),
      items: cartItems.map((item) => ({
        product: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      coinsUsed,
      paymentStatus,
      shippingCharge,
      totalAmount: finalTotal,
      createdAt: new Date(),
    });

    const savedOrder = session
      ? await order.save({ session })
      : await order.save();

    if (session) {
      await clearUserCart(userId, session);
    } else {
      await clearUserCart(userId);
    }

    return savedOrder;
  } catch (error) {
    console.error("Error in placeOrder:", error);
    throw error;
  }
};

export const getOrdersByUser = async (userId) => {
  return await Order.find({ user: userId })
    .populate("items.product")
    .populate("billingAddress")
    .sort({ createdAt: -1 });
};

export const getAllOrders = async () => {
  return await Order.find()
    .populate("items.product")
    .populate("billingAddress")
    .sort({ createdAt: -1 });
};

export const getInvoicePdf = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order || !order.pdfInvoice) {
    return { pdfInvoice: null };
  }

  return {
    pdfInvoice: order.pdfInvoice,
    pdfInvoiceMimeType: order.pdfInvoiceMimeType,
  };
};
