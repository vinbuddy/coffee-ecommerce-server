import express from "express";
import { getUser, getUsers, updateProfile } from "../controllers/user.controller.js";

const router = express.Router();

// Query
router.get("/", getUsers);
router.get("/:id", getUser);
router.put("/:id", updateProfile);

export default router;
