import mongoose from "mongoose";
import mongoose from "mongoose";

const memberRank = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    rank: {
        type: String,
        default: null,
    },
    orderCount: {
        type: Number,
        default: 0,
    },
    expense: {
        type: mongoose.Types.Decimal128,
        default: 0,
    },
    vouchers: [
        {
            type: mongoose.Types.ObjectId,
            ref: "MemberVoucher",
        },
    ],
});

const MemberRankModel = mongoose.model("MemberRank", memberRank);

export default MemberRankModel;
