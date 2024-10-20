import express from "express";
import { getSizes, createSize, editSize, deleteSize } from "../controllers/size.controller.js";

const router = express.Router();

// Query
router.get("/", getSizes);
router.post("/", createSize);
router.put("/:id", editSize);
router.delete("/:id", deleteSize);

export default router;
