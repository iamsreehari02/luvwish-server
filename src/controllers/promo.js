import { subscribeToPromo } from "../services/promo.js";
import { sendPromoEmail } from "../utils/email/sendPromoEmail.js";

export const handlePromoSubscription = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const subscriber = await subscribeToPromo(email);

    if (subscriber.emailSent) {
      return res.status(400).json({
        message: "You have already subscribed and received your promo code.",
        promoCode: subscriber.promoCode,
      });
    }

    try {
      await sendPromoEmail(email, subscriber.promoCode);

      subscriber.emailSent = true;
      await subscriber.save();

      return res.status(200).json({
        message: "Subscribed successfully and promo email sent!",
        promoCode: subscriber.promoCode,
      });
    } catch (emailErr) {
      return res.status(500).json({
        message:
          "Subscription saved, but failed to send promo email. Please try again.",
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
