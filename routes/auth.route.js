import express from "express";
import { createUserAccount, createStoreAccount, loginToStore, loginToAdmin } from "../controllers/auth.controller.js";

const router = express.Router();

// Query

// Auth
router.post("/create-user-account", createUserAccount);
router.post("/create-store-account", createStoreAccount);
router.post("/login-to-store", loginToStore);
router.post("/login-to-admin", loginToAdmin);

export default router;
