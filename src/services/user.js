import User from "../models/User.js";

export const createDummyUser = async () => {
  try {
    const existingUser = await User.findOne({
      email: "sreeharivnambiar72@gmail.com",
    });
    if (existingUser) {
      return { user: existingUser, isNew: false };
    }

    const user = await User.create({
      email: "testuser@example.com",
      name: "Test User",
      provider: "local",
      role: "admin",
    });

    return { user, isNew: true };
  } catch (err) {
    throw new Error(err.message);
  }
};
