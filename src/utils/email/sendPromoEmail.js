import { promoEmailTemplate } from "./templates/promoEmailTemplate.js";
import { transporter } from "./transporter.js";

export const sendPromoEmail = async (toEmail, code) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "🎁 Your 50% OFF Promo Code Inside!",
    html: promoEmailTemplate(code),
  };

  await transporter.sendMail(mailOptions);
};
