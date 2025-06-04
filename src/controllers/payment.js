import User from "../models/User.js";
import { placeOrder } from "../services/order.js";
import { createOrder } from "../services/payment.js";
import { generatePdfBuffer } from "../utils/generatePdfBuffer.js";

export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const coinDiscount = Math.min(user.coins, amount); // use max available coins but not more than amount
    const finalAmount = amount - coinDiscount;

    const order = await createOrder(finalAmount);

    res.status(200).json({
      success: true,
      order,
      coinDiscount,
      payableAmount: finalAmount,
    });
  } catch (err) {
    console.error("Razorpay error:", err);
    res
      .status(500)
      .json({ success: false, message: "Payment initiation failed" });
  }
};

export const verifyPaymentAndPlaceOrder = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      billingData,
    } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const coinsToDeduct = Math.min(user.coins, billingData.totalAmount);
    user.coins -= coinsToDeduct;

    const order = await placeOrder(userId, billingData);

    order.coinDiscount = coinsToDeduct;

    const pdfBuffer = await generatePdfBuffer(order);
    order.pdfInvoice = pdfBuffer;
    order.pdfInvoiceMimeType = "application/pdf";

    await order.save();

    user.coins += 10;
    await user.save();

    res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
