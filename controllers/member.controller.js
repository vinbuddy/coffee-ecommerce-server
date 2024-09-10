import connectToDB from "../config/db.js";
import MemberModel from "../models/member.model.js";

async function getMembers(req, res) {
    try {
        const members = await MemberModel.aggregate([
            {
                $lookup: {
                    from: "memberranks", // tên của collection lưu trữ MemberRank (cần convert thành lowercase và thêm "s")
                    localField: "userId", // liên kết dựa trên trường _id của Member
                    foreignField: "userId", // liên kết với trường userId của MemberRank
                    as: "rankDetail", // tên field mới chứa dữ liệu từ MemberRank
                },
            },
            {
                $unwind: {
                    path: "$rankDetail",
                    preserveNullAndEmptyArrays: true, // nếu không có rankDetail, vẫn giữ nguyên Member
                },
            },
            {
                $lookup: {
                    from: "membervouchers", // tên của collection vouchers
                    localField: "rankDetail.vouchers",
                    foreignField: "_id",
                    as: "rankDetail.vouchers",
                },
            },
            {
                $project: {
                    userId: 1,
                    email: 1,
                    username: 1,
                    avatar: 1,
                    rankDetail: "$rankDetail",
                },
            },
        ]);

        return res.status(200).json({ status: 200, data: members });
    } catch (error) {
        console.log("error: ", error);
        return res.status(500).json({ status: 500, message: error.message });
    }
}

export { getMembers };
