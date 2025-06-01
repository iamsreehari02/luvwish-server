import { createDummyUser as createUserService } from "../services/user.js";

export const createDummyUser = async (req, res) => {
  try {
    const { user, isNew } = await createUserService();

    res.status(isNew ? 201 : 200).json({
      message: isNew ? "Dummy user created" : "User already exists",
      user,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
