import { handleContactUs } from "../services/contact.js";

export const contactUs = async (req, res) => {
  try {
    const { firstName, lastName, email, mobile, message } = req.body;

    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({ error: "Required fields are missing" });
    }

    await handleContactUs({ firstName, lastName, email, mobile, message });

    res.status(200).json({ message: "Message sent successfully" });
  } catch (err) {
    console.error("Contact error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};
