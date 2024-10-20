import express from "express";
import { getToppings, createTopping, deleteTopping, editTopping } from "../controllers/topping.controller.js";

const router = express.Router();

// Query
router.get("/", getToppings);
router.post("/", createTopping);
router.delete("/:id", deleteTopping);
router.put("/:id", editTopping);

export default router;
