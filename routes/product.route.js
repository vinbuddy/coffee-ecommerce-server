import express from "express";
import {
    getProduct,
    getProducts,
    deleteProduct,
    createProduct,
    editProduct,
    getProductSizes,
    getProductToppings,
    uploadProductImage,
} from "../controllers/product.controller.js";

import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Query
router.get("/", getProducts);
router.get("/:id", getProduct);
router.get("/product-sizes/:id", getProductSizes);
router.get("/product-toppings/:id", getProductToppings);

router.post("/upload-image", upload.single("file"), uploadProductImage);

router.post("/", createProduct);
router.put("/:id", editProduct);
router.delete("/:id", deleteProduct);

export default router;
