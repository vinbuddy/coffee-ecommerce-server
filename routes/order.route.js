import express from "express";
import {
    createOrder,
    getOrderInfo,
    getOrders,
    editOrderStatus,
    getUserOrders,
} from "../controllers/order.controller.js";

const router = express.Router();

// Query
router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderInfo);
router.get("/user-order/:user_id", getUserOrders);
router.put("/edit-status/:id", editOrderStatus);

export default router;
