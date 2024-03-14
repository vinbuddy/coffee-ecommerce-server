import express from "express";
import { createUserAccount } from "../controllers/auth.controller.js";

const router = express.Router();

// Query

// Auth
router.post("/create-user-account", createUserAccount);

export default router;
