import express from "express";
import { getCategories, createCategory, editCategory, deleteCategory } from "../controllers/category.controller.js";

const router = express.Router();

// Query
router.get("/", getCategories);
router.post("/", createCategory);
router.put("/:id", editCategory);
router.delete("/:id", deleteCategory);

export default router;
