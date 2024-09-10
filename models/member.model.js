import mongoose from "mongoose";

const member = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
        default: "",
    },
});

const MemberModel = mongoose.model("Member", member);

export default MemberModel;
