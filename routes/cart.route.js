import express from "express";
import {
    addToCart,
    getUserCart,
    editCart,
    deleteCart,
    getTotalItemUserCart,
} from "../controllers/cart.controller.js";

const router = express.Router();

// Query
router.post("/", addToCart);
router.get("/:user_id", getUserCart);
router.get("/total/:user_id", getTotalItemUserCart);
router.put("/:id", editCart);
router.delete("/:id", deleteCart);

export default router;
