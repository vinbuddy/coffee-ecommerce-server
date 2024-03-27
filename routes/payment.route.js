import express from "express";
import {
    createVnPayUrl,
    createMomoUrl,
} from "../controllers/payment.controller.js";

const router = express.Router();

// Query
router.post("/vnpay", createVnPayUrl);
router.post("/momo", createMomoUrl);

export default router;
