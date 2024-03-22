import express from "express";
import {
    getToppings,
    createTopping,
} from "../controllers/topping.controller.js";

const router = express.Router();

// Query
router.get("/", getToppings);
router.post("/", createTopping);

export default router;
