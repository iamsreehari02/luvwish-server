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

export const downloadInvoice = async (req, res) => {
  try {
    const orderId = req.params.id;

    const { pdfInvoice, pdfInvoiceMimeType } = await orderService.getInvoicePdf(
      orderId
    );

    if (!pdfInvoice) {
      return res.status(404).send("Invoice not found");
    }

    res.set({
      "Content-Type": pdfInvoiceMimeType,
      "Content-Disposition": `attachment; filename=invoice-${orderId}.pdf`,
      "Content-Length": pdfInvoice.length,
    });

    res.send(pdfInvoice);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};
