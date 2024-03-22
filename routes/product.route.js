import express from "express";
import {
    getProduct,
    getProducts,
    deleteProduct,
    createProduct,
    editProduct,
    getProductSizes,
    getProductToppings,
} from "../controllers/product.controller.js";

const router = express.Router();

// Query
router.get("/", getProducts);
router.get("/:id", getProduct);
router.get("/product-sizes/:id", getProductSizes);
router.get("/product-toppings/:id", getProductToppings);

router.post("/", createProduct);
router.put("/:id", editProduct);
router.delete("/:id", deleteProduct);

export default router;
