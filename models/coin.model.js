import mongoose from "mongoose";

const coin = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    totalCoins: {
        type: Number,
        default: 0,
    },
    earnedCoins: {
        type: Number,
        default: 0,
    },
    spentCoins: {
        type: Number,
        default: 0,
    },
    history: [
        {
            coinCategory: {
                type: Schema.Types.ObjectId,
                ref: "CoinCategory",
            },
            date: {
                type: Date,
                default: Date.now,
            },
        },
    ],
});

const coinModel = mongoose.model("Coin", coin);

module.exports = coinModel;
