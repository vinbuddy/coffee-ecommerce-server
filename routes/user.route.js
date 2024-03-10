import express from "express";
import {
    addUser,
    getUsers,
    login,
    register,
} from "../controllers/user.controller.js";

const router = express.Router();

// Query
router.get("/", getUsers);
router.post("/", addUser);

// Auth
router.post("/login", login);
router.post("/register", register);

export default router;
