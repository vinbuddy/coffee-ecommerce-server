import mongoose from "mongoose";

const memberCoin = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    coinCount: {
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

const MemberCoinModel = mongoose.model("MemberCoin", memberCoin);

export default MemberCoinModel;
