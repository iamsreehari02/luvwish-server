import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    title: { type: String, enum: ["Mr", "Mrs"], required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    emailSent: { type: Boolean, default: false },
    billingAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },

    shippingCharge: {
      type: Number,
      required: true,
      default: 0,
    },

    coinsUsed: {
      type: Number,
      default: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    razorpayOrderId: {
      type: String,
      unique: true,
      sparse: true,
    },

    razorpayPaymentId: {
      type: String,
    },

    pdfInvoice: {
      type: Buffer,
    },
    pdfInvoiceMimeType: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
