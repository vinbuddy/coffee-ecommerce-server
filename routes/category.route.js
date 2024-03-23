import express from "express";
import {
    getCategories,
    createCategory,
    editCategory,
} from "../controllers/category.controller.js";

const router = express.Router();

// Query
router.get("/", getCategories);
router.post("/", createCategory);
router.put("/:id", editCategory);

export default router;
