import express from "express";
import {
    getUserWishList,
    deleteItemInWishList,
    addToWishList,
} from "../controllers/wishlist.controller.js";

const router = express.Router();

// Query
router.post("/", addToWishList);
router.get("/:user_id", getUserWishList);
router.delete("/:id", deleteItemInWishList);

export default router;
