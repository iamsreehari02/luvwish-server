import { contactUsTemplate } from "./templates/contactUs.js";
import { transporter } from "./transporter.js";

export const sendContactUsEmail = async ({
  firstName,
  lastName,
  email,
  mobile,
  message,
}) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.COMPANY_EMAIL,
    subject: "New Contact Request from Luvwish",
    html: contactUsTemplate({ firstName, lastName, email, mobile, message }),
    replyTo: email,
  };

  await transporter.sendMail(mailOptions);
};
