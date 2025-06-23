import Order from "../models/Order.js";
import User from "../models/User.js";
import { getCartItems } from "../services/cart.js";
import { placeOrder } from "../services/order.js";
import {
  createOrder,
  getRazorpayPaymentStatus,
  redeemCoinsService,
} from "../services/payment.js";
import { sendOrderConfirmationEmail } from "../utils/email/sendOrderEmail.js";
import { generatePdfBuffer } from "../utils/generatePdfBuffer.js";
import crypto from "crypto";
import { isKerala } from "../utils/isKerala.js";
import { calculateShippingCharge } from "../utils/shippingChargeCalculator.js";
import Address from "../models/Address.js";
import mongoose from "mongoose";
import { generateOrderNumber } from "../utils/generateOrderNumber.js";

export const createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const billingData = req.body.billingData;
    const coinsUsed = req.body.coinsUsed || 0;

    if (!billingData) {
      return res
        .status(400)
        .json({ error: "Billing data required to calculate shipping" });
    }

    const cartItems = await getCartItems(userId);
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const amount = cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const inKerala = isKerala(billingData);
    const shippingCharge = calculateShippingCharge(cartItems, inKerala);

    const totalBeforeDiscount = amount + shippingCharge;
    const minOrderAmount = 1;
    const maxAllowedCoinDiscount = totalBeforeDiscount - minOrderAmount;

    if (coinsUsed < 0 || coinsUsed > user.coins) {
      return res
        .status(400)
        .json({ error: "Invalid coin amount. You don’t have enough coins." });
    }

    const coinDiscount = Math.min(coinsUsed, maxAllowedCoinDiscount);
    const finalAmount = totalBeforeDiscount - coinDiscount;

    if (finalAmount < minOrderAmount) {
      return res.status(400).json({
        success: false,
        error: `Order amount must be at least ₹${minOrderAmount}`,
      });
    }

    const amountInPaise = Math.round(finalAmount * 100);
    const maxAllowedAmountPaise = 50000000;

    if (amountInPaise > maxAllowedAmountPaise) {
      return res.status(400).json({
        success: false,
        error: `Amount exceeds maximum allowed limit of ₹${
          maxAllowedAmountPaise / 100
        }`,
      });
    }

    let billingAddressId = billingData.addressId;

    if (!billingAddressId) {
      const newAddress = new Address({
        user: user._id,
        title: billingData.title,
        firstName: billingData.firstName,
        lastName: billingData.lastName,
        email: billingData.email,
        street: billingData.street,
        houseNumber: billingData.houseNumber,
        postcode: billingData.postcode,
        city: billingData.city,
        state: billingData.state,
        country: billingData.country || "India",
        phoneNumber: billingData.phoneNumber,
      });
      await newAddress.save();
      billingAddressId = newAddress._id;
    }

    const razorpayOrder = await createOrder(
      amountInPaise,
      user._id,
      coinsUsed,
      billingAddressId
    );

    res.status(200).json({
      success: true,
      order: razorpayOrder,
      coinDiscount,
      payableAmount: finalAmount,
      shippingCharge,
    });
  } catch (err) {
    console.error("Razorpay error:", err);
    console.error("Error message:", err.message);
    console.error("Stack trace:", err.stack);
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
      coinsUsed = 0,
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

    const existingOrder = await Order.findOne({
      razorpayOrderId: razorpay_order_id,
    });
    if (existingOrder && existingOrder.paymentStatus === "paid") {
      return res.status(200).json({
        message: "Order already placed",
        order: await Order.findById(existingOrder._id)
          .populate("billingAddress")
          .populate("items.product"),
      });
    }

    if (coinsUsed < 0 || coinsUsed > user.coins) {
      return res.status(400).json({ error: "Invalid coins redemption amount" });
    }

    const cartItems = await getCartItems(userId);
    if (!cartItems.length) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const totalAmount = cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const inKerala = isKerala(billingData);
    const shippingCharge = calculateShippingCharge(cartItems, inKerala);

    if (coinsUsed > totalAmount + shippingCharge) {
      return res.status(400).json({ error: "Coins exceed order total" });
    }

    const address = new Address({
      ...billingData,
      user: userId,
    });
    await address.save();
    const billingAddressId = address._id;

    user.coins -= coinsUsed;
    await user.save();

    const grandTotal = totalAmount + shippingCharge - coinsUsed;

    const order = await placeOrder(
      userId,
      billingAddressId,
      shippingCharge,
      null,
      coinsUsed,
      "pending"
    );
    order.razorpayOrderId = razorpay_order_id;
    order.razorpayPaymentId = razorpay_payment_id;
    order.paymentStatus = "paid";
    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("billingAddress")
      .populate("items.product");

    const pdfBuffer = await generatePdfBuffer({
      order: populatedOrder,
      shippingCharge,
      coinsUsed,
      payableAmount: grandTotal,
    });
    populatedOrder.pdfInvoice = pdfBuffer;
    populatedOrder.pdfInvoiceMimeType = "application/pdf";
    await populatedOrder.save();

    try {
      if (!populatedOrder.emailSent) {
        await sendOrderConfirmationEmail(populatedOrder.email, populatedOrder);
        populatedOrder.emailSent = true;
        await populatedOrder.save();
      }
    } catch (emailError) {
      console.error("Error sending email:", emailError);
    }

    user.coins += 10;
    await user.save();

    return res.status(201).json({
      message: "Order placed successfully",
      order: populatedOrder,
      coinsUsed,
      payableAmount: grandTotal,
      shippingCharge,
    });
  } catch (err) {
    console.error("Error in verifyPaymentAndPlaceOrder:", err);
    res.status(500).json({ error: err.message });
  }
};

export const redeemCoins = async (req, res) => {
  try {
    const userId = req.userId;
    const { coinsToRedeem } = req.body;

    const { totalAmount, coinDiscount, payableAmount } =
      await redeemCoinsService(userId, coinsToRedeem);

    res.status(200).json({
      success: true,
      totalAmount,
      coinDiscount,
      payableAmount,
      coinsUsed: coinDiscount,
    });
  } catch (error) {
    console.error("Redeem Coins Error:", error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
};

export const handleRazorpayWebhook = async (req, res) => {
  try {
    console.log("webhook is running");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!req.body) {
      console.error("No raw body found.");
      return res.status(400).send("No raw body.");
    }

    const signature = req.headers["x-razorpay-signature"];

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.body)
      .digest("hex");

    if (generatedSignature !== signature) {
      console.error("[Razorpay Webhook]  Invalid signature.", {
        received: signature,
        expected: generatedSignature,
        bodyLength: req.body.length,
      });
      return res.status(400).send("Invalid signature");
    }

    const event = JSON.parse(req.body.toString());
    console.log("[Razorpay Webhook] Event received:", event.event);

    if (event.event !== "payment.captured") {
      console.log(`[Razorpay Webhook] Not handling event: ${event.event}`);
      return res.status(200).json({ received: true });
    }

    const payment = event.payload.payment.entity;
    console.log("[Razorpay Webhook] Processing payment:", payment.id);

    if (!payment.notes) {
      console.error(
        "[Razorpay Webhook]  No payment.notes found for payment:",
        payment.id
      );
      return res.status(400).send("Missing notes");
    }

    const { userId, coinsUsed, billingAddressId } = payment.notes;
    console.log("[Razorpay Webhook] Payment notes:", {
      userId,
      coinsUsed,
      billingAddressId,
    });

    if (!userId || !billingAddressId) {
      console.error("[Razorpay Webhook]  Missing required fields in notes:", {
        userId,
        billingAddressId,
      });
      return res.status(400).send("Missing userId or billingAddressId");
    }

    // Check if order already exists for this payment
    const existingOrder = await Order.findOne({ paymentId: payment.id });
    if (existingOrder) {
      console.log(
        "[Razorpay Webhook]  Order already exists for payment:",
        payment.id,
        "Order ID:",
        existingOrder._id
      );
      return res
        .status(200)
        .json({ received: true, orderId: existingOrder._id });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.error("[Razorpay Webhook]  User not found:", userId);
      return res.status(404).send("User not found");
    }

    let address = await Address.findById(billingAddressId);
    if (!address) {
      console.error("[Razorpay Webhook]  Address not found:", billingAddressId);
      return res.status(404).send("Address not found");
    }

    if (!address.user) {
      address.user = userId;
      await address.save();
    }

    const cartItems = await getCartItems(user._id);
    if (!cartItems || cartItems.length === 0) {
      console.error(
        "[Razorpay Webhook]  Cart is empty for user:",
        userId,
        "at webhook processing time"
      );
      console.error(
        "[Razorpay Webhook] This might be a timing issue - frontend cleared cart before webhook processed"
      );
      return res.status(400).send("Cart is empty");
    }

    console.log(
      "[Razorpay Webhook] Cart items found:",
      cartItems.length,
      "items"
    );

    const totalAmount = cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const inKerala = isKerala(address);
    const shippingCharge = calculateShippingCharge(cartItems, inKerala);
    const coinsUsedAmount = Number(coinsUsed) || 0;

    const grandTotal = totalAmount + shippingCharge - coinsUsedAmount;
    console.log("[Razorpay Webhook] Order totals:", {
      totalAmount,
      shippingCharge,
      coinsUsedAmount,
      grandTotal,
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const orderNumber = generateOrderNumber();
      console.log(
        "[Razorpay Webhook] Creating order with number:",
        orderNumber
      );

      const customOrder = await placeOrder(
        user._id.toString(),
        billingAddressId,
        shippingCharge,
        session,
        coinsUsedAmount,
        "pending",
        orderNumber
      );

      if (!customOrder) {
        throw new Error("Failed to create order in placeOrder function");
      }

      customOrder.razorpayOrderId = payment.order_id;
      customOrder.paymentId = payment.id;
      customOrder.paymentStatus = "paid";
      customOrder.status = "pending";

      console.log("[Razorpay Webhook] Order created with ID:", customOrder._id);

      if (coinsUsedAmount > 0) {
        console.log(
          "[Razorpay Webhook] Deducting coins:",
          coinsUsedAmount,
          "from user"
        );
        user.coins -= coinsUsedAmount;
        await user.save({ session });
      }

      await customOrder.save({ session });

      // Commit transaction before doing external operations
      await session.commitTransaction();
      console.log("[Razorpay Webhook]  Transaction committed successfully");

      const populatedOrder = await Order.findById(customOrder._id)
        .populate("billingAddress")
        .populate("items.product");

      if (!populatedOrder) {
        throw new Error("Failed to populate order after creation");
      }

      // ===================
      //  PDF Generation
      // ===================
      try {
        console.log(
          "[Razorpay Webhook] Generating PDF for order:",
          populatedOrder._id
        );
        const pdfBuffer = await generatePdfBuffer({
          order: populatedOrder,
          shippingCharge,
          coinsUsed: coinsUsedAmount,
          payableAmount: grandTotal,
        });
        populatedOrder.pdfInvoice = pdfBuffer;
        populatedOrder.pdfInvoiceMimeType = "application/pdf";
        await populatedOrder.save();
        console.log("[Razorpay Webhook]  PDF generated and saved");
      } catch (pdfError) {
        console.error("[Razorpay Webhook]  PDF generation failed:", pdfError);
      }

      // ===================
      // Email Sending
      // ===================
      try {
        if (!populatedOrder.emailSent) {
          await sendOrderConfirmationEmail(
            populatedOrder.billingAddress.email,
            populatedOrder
          );
          populatedOrder.emailSent = true;
          await populatedOrder.save();
        } else {
          console.log("Email already send");
        }
      } catch (emailError) {
        console.error("[Razorpay Webhook]  Error sending email:", emailError);
      }

      // ===================
      //  Reward user
      // ===================
      try {
        user.coins += 10;
        await user.save();
        console.log("[Razorpay Webhook]  Rewarded user with 10 coins");
      } catch (rewardError) {
        console.error("[Razorpay Webhook]  Error rewarding user:", rewardError);
      }

      console.log(
        "[Razorpay Webhook]  Order processed successfully:",
        customOrder._id
      );
      return res.status(200).json({
        received: true,
        orderId: customOrder._id,
        orderNumber: customOrder.orderNumber,
      });
    } catch (error) {
      console.error("[Razorpay Webhook]  Transaction error:", error);
      if (session?.inTransaction?.()) {
        try {
          await session.abortTransaction();
          console.log("[Razorpay Webhook] Transaction aborted");
        } catch (abortError) {
          console.error(
            "[Razorpay Webhook] Error aborting transaction:",
            abortError
          );
        }
      }

      // Check if order was actually created despite the error
      const orderCheck = await Order.findOne({ paymentId: payment.id });
      if (orderCheck) {
        console.log(
          "[Razorpay Webhook] ⚡️ Order exists despite transaction error:",
          orderCheck._id
        );
        return res
          .status(200)
          .json({ received: true, orderId: orderCheck._id });
      }

      return res.status(500).send("Internal Server Error");
    } finally {
      if (session) {
        session.endSession();
      }
    }
  } catch (error) {
    console.error("[Razorpay Webhook]  Error:", error);
    return res.status(500).send("Internal Server Error");
  }
};

export const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await getRazorpayPaymentStatus(orderId);

    if (result.status === "captured") {
      return res.json({
        status: "captured",
        paymentId: result.paymentId,
        signature: result.signature || null,
      });
    }

    res.json({ status: result.status });
  } catch (err) {
    console.error("Error in getPaymentStatus controller:", err.message);
    res.status(500).json({ error: "Unable to fetch payment status" });
  }
};
