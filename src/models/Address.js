import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    title: { type: String, enum: ["Mr", "Mrs", "Ms", "Dr"], required: true },

    firstName: { type: String, required: true },
    lastName: { type: String, required: true },

    email: { type: String, required: true },

    street: { type: String, required: true },
    houseNumber: { type: String, required: true },
    postcode: { type: String, required: true },
    city: { type: String, required: true },

    country: { type: String, default: "India", required: true },

    phoneNumber: { type: String, required: true },

    type: {
      type: String,
      enum: ["billing", "shipping"],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Address", addressSchema);
