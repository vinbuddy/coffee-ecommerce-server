import express from "express";
import env from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";

import userRoutes from "./routes/user.route.js";
import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import toppingRoutes from "./routes/topping.route.js";
import sizeRoutes from "./routes/size.route.js";
import categoryRoutes from "./routes/category.route.js";
import storeRoutes from "./routes/store.route.js";
import cartRoutes from "./routes/cart.route.js";
import paymentRoutes from "./routes/payment.route.js";
import voucherRoutes from "./routes/voucher.route.js";
import orderRoutes from "./routes/order.route.js";
import wishlistRoutes from "./routes/wishlist.route.js";
import reviewRoutes from "./routes/review.route.js";
import revenueRoutes from "./routes/revenue.route.js";
import memberRoutes from "./routes/member.route.js";

env.config();

const app = express();
const port = process.env.PORT || 3003;

app.use(cors());
app.options("*", cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.disable("etag");

// Routes
app.get("/", (req, res) => {
    res.send("Welcome to Coffee Ecommerce API");
});
app.use("/user", userRoutes);
app.use("/auth", authRoutes);
app.use("/product", productRoutes);
app.use("/topping", toppingRoutes);
app.use("/size", sizeRoutes);
app.use("/category", categoryRoutes);
app.use("/store", storeRoutes);
app.use("/cart", cartRoutes);
app.use("/payment", paymentRoutes);
app.use("/voucher", voucherRoutes);
app.use("/order", orderRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/review", reviewRoutes);
app.use("/revenue", revenueRoutes);
app.use("/member", memberRoutes);

app.listen(port, () => {
    const mongodbURI = process.env.MONGODB_URI;
    mongoose.connect(mongodbURI).then(
        (dbo) => {
            console.log("MongoDB connected 🚀");
            console.log(`running on http://localhost:${port}`);
        },
        (err) => {
            console.log("MongoDB connection error: ", err);
            console.log("MongoDB connection failed ❌");
        }
    );
});
