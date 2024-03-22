import express from "express";
import {
    getCategories,
    createCategory,
} from "../controllers/category.controller.js";

const router = express.Router();

// Query
router.get("/", getCategories);
router.post("/", createCategory);

export default router;
