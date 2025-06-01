import mongoose from "mongoose";

const promoSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    promoCode: {
      type: String,
      required: true,
      unique: true,
    },
    discount: {
      type: String,
      default: "50% OFF",
    },
    claimed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("PromoSubscriber", promoSubscriberSchema);
