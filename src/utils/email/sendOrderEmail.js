import { orderConfirmationTemplate } from "./templates/orderConfirmationEmail.js";
import { transporter } from "./transporter.js";

export const sendOrderConfirmationEmail = async (toEmail, order) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: `Order Confirmation - Order #${order.orderNumber}`,
    html: orderConfirmationTemplate(order),
  };

  await transporter.sendMail(mailOptions);
};
