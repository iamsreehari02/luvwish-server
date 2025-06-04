import express from "express";
import { handleContactMessage } from "../controllers/contactMessage.js";

const router = express.Router();

router.post("/", handleContactMessage);

export default router;
