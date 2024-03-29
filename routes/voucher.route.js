import express from "express";
import {
    getVouchers,
    getVoucher,
    getUserVouchers,
    createVoucher,
    editVoucher,
} from "../controllers/voucher.controller.js";

const router = express.Router();

// Query
router.get("/", getVouchers);
router.get("/:id", getVoucher);
router.get("/user/:user_id", getUserVouchers);
router.post("/", createVoucher);
router.put("/:id", editVoucher);

export default router;
