import Order from "../models/Order.js";
import Address from "../models/Address.js";
import Cart from "../models/Cart.js";
import User from "../models/User.js";

export const placeOrder = async (userId, billingData) => {
  const user = await User.findById(userId);
  const cart = await Cart.findOne({ user: userId }).populate("items.product");

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  const billingAddress = await Address.create({ ...billingData, user: userId });

  const totalAmount = cart.items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const orderEmail = billingData.email || user.email;

  const order = await Order.create({
    user: userId,
    items: cart.items.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.price,
    })),
    billingAddress: billingAddress._id,
    totalAmount,
    title: billingData.title,
    phoneNumber: billingData.phoneNumber,
    email: orderEmail,
  });

  const fullOrder = await Order.findById(order._id)
    .populate("items.product")
    .populate("billingAddress");

  await Cart.deleteOne({ user: userId });

  return fullOrder;
};

export const getOrdersByUser = async (userId) => {
  return await Order.find({ user: userId })
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
