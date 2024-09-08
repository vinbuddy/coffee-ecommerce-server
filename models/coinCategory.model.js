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

const CoinCategoryModel = mongoose.model("CoinCategory", coinCategory);

export default CoinCategoryModel;
