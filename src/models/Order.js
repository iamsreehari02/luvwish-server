import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, enum: ["Mr", "Mrs"], required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
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
    status: {
      type: String,
      enum: ["pending", "shipped", "delivered"],
      default: "pending",
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
