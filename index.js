import express from "express";
import env from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

import userRoutes from "./routes/user.route.js";

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

app.listen(port, () => {
    console.log(`running on http://localhost:${port}`);
});
