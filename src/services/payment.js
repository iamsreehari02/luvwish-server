import Razorpay from "razorpay";

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

export const createOrder = async (amount, discount = 0) => {
  const finalAmount = amount - discount;
  const options = {
    amount: finalAmount * 100,
    currency: "INR",
    receipt: "receipt_order_" + new Date().getTime(),
  };

  const order = await razorpayInstance.orders.create(options);
  return { order, finalAmount };
};
