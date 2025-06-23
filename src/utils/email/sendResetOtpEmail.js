import { resetOtpEmailTemplate } from "./templates/resetOtpEmail.js";
import { transporter } from "./transporter.js";

export const sendResetOtpEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Reset Your Luvwish Password",
    html: resetOtpEmailTemplate(otp),
  };

  await transporter.sendMail(mailOptions);
};
