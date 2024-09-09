export const ORDER_STATUS = {
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    PENDING: "Đang chờ",
    SHIPPING: "Đang giao",
};

// Enum cho hạng thành viên
export const MEMBER_RANK = Object.freeze({
    MEMBER: "member",
    SILVER: "silver",
    GOLD: "gold",
    DIAMOND: "diamond",
});

// Enum cho số lượng đơn hàng cần thiết để đạt hạng
export const ORDER_COUNT_THRESHOLD = Object.freeze({
    SILVER: 15,
    GOLD: 25,
    DIAMOND: 40,
});

export const EXPENSE_THRESHOLD = Object.freeze({
    SILVER: 500000, // 500,000 VND
    GOLD: 1000000, // 1,000,000 VND
    DIAMOND: 3000000, // 3,000,000 VND
});
