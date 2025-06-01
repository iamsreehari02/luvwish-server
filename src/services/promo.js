import PromoSubscriber from "../models/Promo.js";
import { generatePromoCode } from "../utils/generatePromoCode.js";

export const subscribeToPromo = async (email) => {
  let subscriber = await PromoSubscriber.findOne({ email });

  if (!subscriber) {
    const promoCode = generatePromoCode();

    subscriber = await PromoSubscriber.create({
      email,
      promoCode,
      emailSent: false,
    });
  }

  return subscriber;
};
