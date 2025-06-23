import express from "express";
import { createDummyUser } from "../controllers/user.js";

const router = express.Router();

router.post("/", createDummyUser);

export default router;
