import express from "express";
import { createVnPayUrl } from "../controllers/payment.controller.js";

const router = express.Router();

// Query
router.post("/vnpay", createVnPayUrl);

export default router;
