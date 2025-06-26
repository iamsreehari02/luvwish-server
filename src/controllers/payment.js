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
import { clearUserCart } from "../utils/clearCart.js";

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
        .json({ error: "Invalid coin amount. You don't have enough coins." });
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

    // Pass cartItems to createOrder function
    const razorpayOrder = await createOrder(
      amountInPaise,
      user._id,
      coinsUsed,
      billingAddressId,
      cartItems // Pass cart items here
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

    const existingRazorpayOrder = await Order.findOne({
      razorpayOrderId: razorpay_order_id,
    });
    if (existingRazorpayOrder) {
      console.log(
        "[verifyPaymentAndPlaceOrder] ⚡️ Order already exists for:",
        razorpay_order_id
      );
      return res.status(200).json({
        message: "Order already placed",
        order: await Order.findById(existingRazorpayOrder._id)
          .populate("billingAddress")
          .populate("items.product"),
      });
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
      "pending",
      cartItems
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
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const processWebhook = async (attempt = 1) => {
    try {
      console.log(
        `[Razorpay Webhook] Processing attempt ${attempt}/${MAX_RETRIES}`
      );

      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

      if (!req.body) {
        console.error("[Razorpay Webhook] No raw body found.");
        return res.status(400).send("No raw body.");
      }

      const signature = req.headers["x-razorpay-signature"];
      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(req.body)
        .digest("hex");

      if (generatedSignature !== signature) {
        console.error("[Razorpay Webhook] Invalid signature.", {
          received: signature,
          expected: generatedSignature,
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

      if (!payment.notes) {
        console.error("[Razorpay Webhook] No payment.notes found:", payment.id);
        return res.status(400).send("Missing notes");
      }

      const {
        userId,
        coinsUsed,
        billingAddressId,
        cartItems: cartItemsStr,
      } = payment.notes;

      if (!userId || !billingAddressId) {
        console.error("[Razorpay Webhook] Missing required fields:", {
          userId,
          billingAddressId,
        });
        return res.status(400).send("Missing userId or billingAddressId");
      }

      // Parse cart items from notes
      let cartItems;
      try {
        cartItems = cartItemsStr ? JSON.parse(cartItemsStr) : [];
      } catch (parseError) {
        console.error(
          "[Razorpay Webhook] Error parsing cart items:",
          parseError
        );
        return res.status(400).send("Invalid cart items data");
      }

      if (!cartItems || cartItems.length === 0) {
        console.error(
          "[Razorpay Webhook] No cart items found in payment notes"
        );
        return res.status(400).send("Cart items missing from payment notes");
      }

      console.group("[Razorpay Webhook] Payment Context");
      console.log({
        paymentId: payment.id,
        userId,
        billingAddressId,
        coinsUsed,
        cartItemsCount: cartItems.length,
        attempt,
      });
      console.groupEnd();

      // Check if order already created (idempotency check)
      const existingRazorpayOrder = await Order.findOne({
        razorpayOrderId: payment.order_id,
      });
      if (existingRazorpayOrder) {
        console.log(
          "[Razorpay Webhook] ⚡️ Order already exists:",
          payment.order_id
        );
        return res.status(200).json({
          received: true,
          orderId: existingRazorpayOrder._id,
          status: "already_processed",
        });
      }

      // Also check by payment ID (additional safety)
      const existingPaymentOrder = await Order.findOne({
        paymentId: payment.id,
      });
      if (existingPaymentOrder) {
        console.log(
          "[Razorpay Webhook] ⚡️ Order with payment ID already exists:",
          payment.id
        );
        return res.status(200).json({
          received: true,
          orderId: existingPaymentOrder._id,
          status: "already_processed",
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        console.error("[Razorpay Webhook] User not found:", userId);
        return res.status(404).send("User not found");
      }

      const address = await Address.findById(billingAddressId);
      if (!address) {
        console.error(
          "[Razorpay Webhook] Address not found:",
          billingAddressId
        );
        return res.status(404).send("Address not found");
      }

      if (!address.user) {
        address.user = userId;
        await address.save();
      }

      const totalAmount = cartItems.reduce(
        (t, item) => t + item.price * item.quantity,
        0
      );
      const inKerala = isKerala(address);
      const shippingCharge = calculateShippingCharge(cartItems, inKerala);
      const coinsUsedAmount = Number(coinsUsed) || 0;
      const grandTotal = totalAmount + shippingCharge - coinsUsedAmount;

      console.group("[Razorpay Webhook] Totals");
      console.log({ totalAmount, shippingCharge, coinsUsedAmount, grandTotal });
      console.groupEnd();

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const orderNumber = generateOrderNumber();
        console.log(
          `[Razorpay Webhook] Creating order: ${orderNumber} (attempt ${attempt})`
        );

        const customOrder = await placeOrder(
          user._id,
          billingAddressId,
          shippingCharge,
          session,
          coinsUsedAmount,
          "paid",
          orderNumber,
          cartItems,
          {
            razorpayOrderId: payment.order_id,
            paymentId: payment.id,
          }
        );

        if (!customOrder) {
          throw new Error("Failed to create order");
        }

        if (coinsUsedAmount > 0) {
          user.coins -= coinsUsedAmount;
          await user.save({ session });
        }

        await session.commitTransaction();

        const populatedOrder = await Order.findById(customOrder._id)
          .populate("billingAddress")
          .populate("items.product");

        // ===================
        // PDF Generation (non-blocking)
        // ===================
        setImmediate(async () => {
          try {
            const pdfBuffer = await generatePdfBuffer({
              order: populatedOrder,
              shippingCharge,
              coinsUsed: coinsUsedAmount,
              payableAmount: grandTotal,
            });
            populatedOrder.pdfInvoice = pdfBuffer;
            populatedOrder.pdfInvoiceMimeType = "application/pdf";
            await populatedOrder.save();
            console.log(
              `[Razorpay Webhook] PDF generated for order: ${customOrder.orderNumber}`
            );
          } catch (pdfError) {
            console.error(
              "[Razorpay Webhook] PDF generation failed:",
              pdfError
            );
          }
        });

        // ===================
        // Email Sending (non-blocking)
        // ===================
        setImmediate(async () => {
          try {
            if (!populatedOrder.emailSent) {
              await sendOrderConfirmationEmail(
                populatedOrder.billingAddress.email,
                populatedOrder
              );
              populatedOrder.emailSent = true;
              await populatedOrder.save();
              console.log(
                `[Razorpay Webhook] Email sent for order: ${customOrder.orderNumber}`
              );
            }
          } catch (emailError) {
            console.error(
              "[Razorpay Webhook] Error sending email:",
              emailError
            );
          }
        });

        // ===================
        // Reward user (non-blocking)
        // ===================
        setImmediate(async () => {
          try {
            user.coins += 10;
            await user.save();
            console.log(`[Razorpay Webhook] User rewarded: ${userId}`);
          } catch (rewardError) {
            console.error(
              "[Razorpay Webhook] Error rewarding user:",
              rewardError
            );
          }
        });

        console.log(
          `[Razorpay Webhook] ✅ Order created successfully: ${customOrder.orderNumber}`
        );
        return res.status(200).json({
          received: true,
          orderId: customOrder._id,
          orderNumber: customOrder.orderNumber,
          status: "created",
          attempt,
        });
      } catch (error) {
        console.error(
          `[Razorpay Webhook] Transaction error (attempt ${attempt}):`,
          error
        );
        if (session?.inTransaction?.()) {
          await session.abortTransaction();
        }

        // Check if order was created by another process/webhook
        const orderCheck = await Order.findOne({ paymentId: payment.id });
        if (orderCheck) {
          console.log(
            "[Razorpay Webhook] Order found in final check, returning success"
          );
          return res.status(200).json({
            received: true,
            orderId: orderCheck._id,
            status: "found_existing",
          });
        }

        // If this is a retryable error and we haven't exhausted retries
        if (attempt < MAX_RETRIES && isRetryableError(error)) {
          console.log(`[Razorpay Webhook] Retrying in ${RETRY_DELAY}ms...`);
          await sleep(RETRY_DELAY * attempt); // Exponential backoff
          return processWebhook(attempt + 1);
        }

        throw error; // Re-throw if no more retries
      } finally {
        if (session) {
          session.endSession();
        }
      }
    } catch (error) {
      if (attempt < MAX_RETRIES && isRetryableError(error)) {
        console.error(
          `[Razorpay Webhook] Error on attempt ${attempt}, retrying:`,
          error.message
        );
        await sleep(RETRY_DELAY * attempt);
        return processWebhook(attempt + 1);
      }

      console.error(
        `[Razorpay Webhook] Final error after ${attempt} attempts:`,
        error
      );
      throw error;
    }
  };

  // Helper function to determine if error is retryable
  const isRetryableError = (error) => {
    const retryableErrors = [
      "ECONNRESET",
      "ETIMEDOUT",
      "ENOTFOUND",
      "MongoNetworkError",
      "MongoTimeoutError",
      "VersionError", // MongoDB optimistic concurrency
    ];

    return retryableErrors.some(
      (retryableError) =>
        error.name?.includes(retryableError) ||
        error.message?.includes(retryableError) ||
        error.code === 11000 // Duplicate key error
    );
  };

  try {
    await processWebhook();
  } catch (error) {
    console.error("[Razorpay Webhook] All retry attempts failed:", error);
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
