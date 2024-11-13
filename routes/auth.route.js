import express from "express";
import {
    createUserAccount,
    createStoreAccount,
    loginToStore,
    loginToAdmin,
    editStoreAccount,
    deleteStoreAccount,
    getStoreAccounts,
} from "../controllers/auth.controller.js";

const router = express.Router();

// Query

// Auth
router.post("/create-user-account", createUserAccount);
router.put("/edit-store-account", editStoreAccount);
router.delete("/delete-store-account/:id", deleteStoreAccount);
router.post("/create-store-account", createStoreAccount);
router.post("/login-to-store", loginToStore);
router.post("/login-to-admin", loginToAdmin);

router.get("/store-account", getStoreAccounts);

export default router;
