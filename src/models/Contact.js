import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: String,
    mobile: String,
    message: String,
  },
  { timestamps: true }
);

export const Contact = mongoose.model("Contact", contactSchema);
