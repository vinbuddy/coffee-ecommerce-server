import express from "express";
import { getUser, getUsers } from "../controllers/user.controller.js";

const router = express.Router();

// Query
router.get("/", getUsers);
router.get("/:id", getUser);

export default router;
