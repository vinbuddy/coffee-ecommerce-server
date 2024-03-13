import express from "express";
import { socialRegister } from "../controllers/auth.controller.js";

const router = express.Router();

// Query

// Auth
router.post("/social-register", socialRegister);

export default router;
