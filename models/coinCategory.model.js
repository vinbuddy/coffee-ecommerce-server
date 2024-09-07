import mongoose from "mongoose";

const coinCategory = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    value: {
        type: Number,
        default: 0,
    },
    description: {
        type: String,
        default: "",
    },
});

const coinCategoryModel = mongoose.model("CoinCategory", coinCategory);

module.exports = coinCategoryModel;
