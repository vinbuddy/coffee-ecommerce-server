import express from "express";
import {
    getStores,
    createStore,
    editStore,
    getStoreLocations,
} from "../controllers/store.controller.js";

const router = express.Router();

// Query
router.get("/", getStores);
router.get("/location", getStoreLocations);
router.post("/", createStore);
router.put("/:id", editStore);

export default router;
