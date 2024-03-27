import express from "express";
import env from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

import userRoutes from "./routes/user.route.js";
import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import toppingRoutes from "./routes/topping.route.js";
import sizeRoutes from "./routes/size.route.js";
import categoryRoutes from "./routes/category.route.js";
import storeRoutes from "./routes/store.route.js";
import cartRoutes from "./routes/cart.route.js";
import paymentRoutes from "./routes/payment.route.js";

env.config();

const app = express();
const port = process.env.PORT || 3003;

app.use(cors());
app.options("*", cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.disable("etag");

// Routes
app.use("/user", userRoutes);
app.use("/auth", authRoutes);
app.use("/product", productRoutes);
app.use("/topping", toppingRoutes);
app.use("/size", sizeRoutes);
app.use("/category", categoryRoutes);
app.use("/store", storeRoutes);
app.use("/cart", cartRoutes);
app.use("/payment", paymentRoutes);

app.listen(port, () => {
    console.log(`running on http://localhost:${port}`);
});
