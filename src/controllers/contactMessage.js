import { saveContactMessage } from "../services/contactMessage.js";

export const handleContactMessage = async (req, res) => {
  try {
    const { firstName, lastName, email, mobile, message } = req.body;

    if (!firstName || !lastName || !email || !mobile || !message) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const savedMessage = await saveContactMessage({
      firstName,
      lastName,
      email,
      mobile,
      message,
    });

    res.status(201).json({
      message: "Your message has been received. We'll get back to you soon!",
      data: savedMessage,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
