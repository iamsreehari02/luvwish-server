import { Contact } from "../models/Contact.js";
import { sendContactUsEmail } from "../utils/email/sendContactUsEmail.js";

export const handleContactUs = async ({
  firstName,
  lastName,
  email,
  mobile,
  message,
}) => {
  const contact = new Contact({
    firstName,
    lastName,
    email,
    mobile,
    message,
  });
  await contact.save();
  await sendContactUsEmail({ firstName, lastName, email, mobile, message });

  return { success: true };
};
