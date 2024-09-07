import express from "express";
import { getAdminRevenue, getStoreRevenue } from "../controllers/revenue.controller.js";

const router = express.Router();

// Query
router.get("/admin", getAdminRevenue);
router.get("/store", getStoreRevenue);

export default router;
