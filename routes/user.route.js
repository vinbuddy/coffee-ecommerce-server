import express from "express";
import { getUser, getUsers, updateProfile, getUserByEmailOrPhone } from "../controllers/user.controller.js";

const router = express.Router();

// Query
router.get("/", getUsers);
router.get("/email-or-phone", getUserByEmailOrPhone);
router.get("/:id", getUser);
router.put("/:id", updateProfile);

export default router;
