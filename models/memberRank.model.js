import mongoose from "mongoose";

const memberRank = new mongoose.Schema(
    {
        userId: {
            type: String,
            ref: "Member",
            required: true,
        },
        rank: {
            type: String,
            enum: ["member", "silver", "gold", "diamond"],
            default: "member",
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
        sixMonthOrderCount: {
            type: Number,
            default: 0,
        },
        sixMonthExpense: {
            type: mongoose.Types.Decimal128,
            default: 0,
        },
        yearlyOrderCount: {
            type: Number,
            default: 0,
        },
        yearlyExpense: {
            type: mongoose.Types.Decimal128,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const MemberRankModel = mongoose.model("MemberRank", memberRank);

export default MemberRankModel;
