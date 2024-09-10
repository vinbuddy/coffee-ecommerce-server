import mongoose from "mongoose";

const memberVoucher = new mongoose.Schema({
    voucher_name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    start_date: {
        type: Date,
        default: Date.now,
    },
    end_date: {
        type: Date,
        default: Date.now,
    },
    image: {
        type: String,
        required: true,
    },
    discount_type: {
        type: String,
        required: true,
    },
    discount_price: {
        type: Number,
        required: true,
    },
    min_price: {
        type: Number,
        required: true,
    },
    rank: {
        type: String,
        required: true,
        enum: ["silver", "gold", "diamond"],
    },
});

const MemberVoucherModel = mongoose.model("MemberVoucher", memberVoucher);

export default MemberVoucherModel;
