import Order from "../models/Order.js";
import * as orderService from "../services/order.js";
import { sendOrderConfirmationEmail } from "../utils/email/sendOrderEmail.js";

export const createOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { billingData } = req.body;

    const order = await orderService.placeOrder(userId, billingData);

    try {
      await sendOrderConfirmationEmail(order.email, order);
    } catch (emailErr) {
      console.error("Error sending order email:", emailErr);
    }

    res.status(201).json({ message: "Order placed", order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const userId = req.userId;
    const orders = await orderService.getOrdersByUser(userId);
    res.status(200).json({ orders });
  } catch (err) {
    res.status(500).json({ error: "Could not load orders" });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await orderService.getAllOrders();
    res.status(200).json({ orders });
  } catch (err) {
    console.error("Error fetching all orders:", err);
    res.status(500).json({ error: "Could not fetch orders" });
  }
};

export const downloadInvoice = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.userId;
    const userRole = req.userRole;

    const order = await Order.findById(orderId);

    if (!order) return res.status(404).send("Order not found");

    if (order.user.toString() !== userId && userRole !== "admin") {
      return res.status(403).send("Access denied");
    }

    const { pdfInvoice, pdfInvoiceMimeType, orderNumber } = order;

    if (!pdfInvoice) {
      return res.status(404).send("Invoice not found");
    }

    res.set({
      "Content-Type": pdfInvoiceMimeType,
      "Content-Disposition": `attachment; filename=invoice-${orderNumber}.pdf`,
      "Content-Length": pdfInvoice.length,
    });

    res.send(pdfInvoice);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};
