import express from "express";
import {
    getReviews,
    getProductReviews,
    createReview,
} from "../controllers/review.controller.js";

const router = express.Router();

// Query
router.get("/", getReviews);
router.get("/product/:product_id", getProductReviews);
router.post("/", createReview);

export default router;
