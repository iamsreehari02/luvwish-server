import { calculateBillingAmount } from "../services/billing.js";

export const calculateBillingAmountHandler = async (req, res) => {
  try {
    const userId = req.userId;
    const { coinsUsed = 0 } = req.body;
    const { state } = req.body.billingData;

    const safeState = state || "";

    const result = await calculateBillingAmount(userId, safeState, coinsUsed);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("Billing calculation error:", err);
    res.status(400).json({ error: err.message || "Something went wrong" });
  }
};
