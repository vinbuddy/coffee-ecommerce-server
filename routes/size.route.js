import express from "express";
import { getSizes, createSize } from "../controllers/size.controller.js";

const router = express.Router();

// Query
router.get("/", getSizes);
router.post("/", createSize);

export default router;
