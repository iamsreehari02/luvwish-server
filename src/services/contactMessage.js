import { ContactMessage } from "../models/ContactMessage.js";

export const saveContactMessage = async (data) => {
  const message = new ContactMessage(data);
  return await message.save();
};
