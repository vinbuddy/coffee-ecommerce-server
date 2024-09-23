import connectToDB from "../config/db.js";
import moment from "moment";
import MemberRankModel from "../models/memberRank.model.js";
import mongoose from "mongoose";
import { EXPENSE_THRESHOLD, ORDER_COUNT_THRESHOLD, MEMBER_RANK } from "../utils/constant.js";

async function getOrders(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });
    try {
        const [rows] = await pool.execute(
            `SELECT Orders.*, Users.id AS user_id, Users.user_name, Users.email, Users.avatar, Stores.id AS store_id,
            Stores.store_name,
            Vouchers.id AS voucher_id,
            Vouchers.voucher_name
            FROM Orders
            LEFT JOIN Users ON Users.id = Orders.user_id
            LEFT JOIN Stores ON Stores.id = Orders.store_id
            LEFT JOIN Vouchers ON Vouchers.id = Orders.voucher_id
            ORDER BY Orders.order_date DESC`
        );

        return res.status(200).json({ status: 200, message: "success", data: rows });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function getUserOrders(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });
    const user_id = req.params.user_id;

    try {
        const [orders] = await pool.query(
            `SELECT Orders.*, Users.id AS user_id, Users.user_name, Users.email, Users.avatar, Stores.id AS store_id,
            Stores.store_name,
            Vouchers.id AS voucher_id,
            Vouchers.voucher_name
            FROM Orders
            LEFT JOIN Users ON Users.id = Orders.user_id
            LEFT JOIN Stores ON Stores.id = Orders.store_id
            LEFT JOIN Vouchers ON Vouchers.id = Orders.voucher_id
            WHERE Orders.user_id = '${user_id}'
            ORDER BY Orders.order_date DESC`
        );

        const orderIds = orders.map((order) => `'${order.id}'`).join(",");

        const [orderDetails] = await pool.query(
            `SELECT 
            od.id,
            od.order_id,
            p.id AS product_id,
            p.name AS product_name,
            p.price AS product_price,
            p.image AS product_image,
            s.size_name AS size_name,
            ps.size_price AS size_price,
            od.quantity AS quantity
            FROM 
                OrderDetails od
            LEFT JOIN 
                Products p ON od.product_id = p.id
            LEFT JOIN 
                ProductSizes ps ON od.product_id = ps.product_id AND od.size_id = ps.size_id
            LEFT JOIN 
                Sizes s ON od.size_id = s.id
            WHERE
                od.order_id IN (${orderIds})
            GROUP BY
                od.id, p.name, p.price, p.image, s.size_name, ps.size_price, od.quantity;`
        );

        const orderDetailsMap = orderDetails.reduce((map, detail) => {
            if (!map[detail.order_id]) map[detail.order_id] = [];
            map[detail.order_id].push(detail);
            return map;
        }, {});

        const [reviews] = await pool.query(`SELECT * FROM Reviews WHERE order_id IN (${orderIds})`);
        const reviewsMap = reviews.reduce((map, review) => {
            map[review.order_id] = true;
            return map;
        }, {});

        const orderDetailIds = orderDetails.map((detail) => `'${detail.id}'`).join(",");
        const [orderToppings] = await pool.query(
            `SELECT
            ts.id AS topping_storage_id,
            ts.order_detail_id,
            t.topping_name,
            t.topping_price
            FROM
                ToppingStorages ts
            LEFT JOIN
                Toppings t ON ts.topping_id = t.id
            WHERE
                ts.order_detail_id IN (${orderDetailIds})`
        );

        const orderToppingsMap = orderToppings.reduce((map, topping) => {
            if (!map[topping.order_detail_id]) map[topping.order_detail_id] = [];
            map[topping.order_detail_id].push(topping);
            return map;
        }, {});

        // const orderData = orders.map((order) => {
        //     const orderItems = orderDetailsMap[order.id] || [];
        //     orderItems.forEach((item) => {
        //         const toppings = orderToppingsMap[item.id] || [];
        //         item.toppings = toppings.length > 0 ? toppings : null;
        //         item.order_item_price =
        //             (toppings.reduce((acc, curr) => acc + parseFloat(curr.topping_price), 0) +
        //                 parseFloat(item.product_price) +
        //                 parseFloat(item.size_price)) *
        //             parseFloat(item.quantity);
        //     });
        //     return {
        //         ...order,
        //         order_items: orderItems,
        //         is_reviewed: !!reviewsMap[order.id],
        //     };
        // });
        const orderData = orders.map((order) => {
            const orderItems = orderDetailsMap[order.id] || [];
            orderItems.forEach((item) => {
                const toppings = orderToppingsMap[item.id] || [];

                // Calculate item price, handling null values and empty arrays gracefully
                const productPrice = parseFloat(item.product_price) || 0;
                const sizePrice = item.size_price ? parseFloat(item.size_price) : 0;
                const toppingsPrice =
                    toppings.length > 0 ? toppings.reduce((acc, curr) => acc + parseFloat(curr.topping_price), 0) : 0;
                const quantity = parseFloat(item.quantity) || 0;

                // Calculate order_item_price considering toppings and size_price
                let orderItemPrice = productPrice; // Start with base product price

                // Add size price if it exists
                if (item.size_price !== null) {
                    orderItemPrice += sizePrice;
                }

                // Add toppings price if toppings exist
                if (toppings.length > 0) {
                    orderItemPrice += toppingsPrice;
                }

                // Multiply by quantity
                orderItemPrice *= quantity;

                item.order_item_price = orderItemPrice;
            });
            return {
                ...order,
                order_items: orderItems,
                is_reviewed: !!reviewsMap[order.id],
            };
        });

        return res.status(200).json({ status: 200, message: "success", data: orderData });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function getOrderInfo(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });
    try {
        await pool.beginTransaction();
        const orderDetailData = [];

        const order_id = req.params.id;
        const [orders, fields] = await pool.query(
            `SELECT Orders.*, Users.id AS user_id,
            Users.user_name, Users.email, Users.avatar, Vouchers.id AS voucher_id, Vouchers.voucher_name, Stores.id AS store_id, Stores.store_name
            FROM Orders
            LEFT JOIN Users ON Users.id = Orders.user_id
            LEFT JOIN Vouchers ON Vouchers.id = Orders.voucher_id
            LEFT JOIN Stores ON Stores.id = Orders.store_id
            WHERE Orders.id = '${order_id}'`
        );

        const [orderDetails] = await pool.query(
            `SELECT
            od.id,
            p.id AS product_id,
            p.name AS product_name,
            p.price AS product_price,
            p.image AS product_image,
            s.size_name AS size_name,
            ps.size_price AS size_price,
            od.quantity AS quantity
            FROM
                OrderDetails od
            LEFT JOIN
                Products p ON od.product_id = p.id
            LEFT JOIN
                ProductSizes ps ON od.product_id = ps.product_id AND od.size_id = ps.size_id
            LEFT JOIN
                Sizes s ON od.size_id = s.id
            WHERE
                od.order_id = '${order_id}'
            GROUP BY
                od.id, p.id, p.name, p.price, p.image, s.size_name, ps.size_price, od.quantity;`
        );

        for (const orderDetail of orderDetails) {
            const [orderToppings] = await pool.query(
                `SELECT
                ts.id AS topping_storage_id,
                t.topping_name,
                t.topping_price
                FROM
                    ToppingStorages ts
                LEFT JOIN
                    Toppings t ON ts.topping_id = t.id
                WHERE
                    ts.order_detail_id = '${orderDetail.order_id}'`
            );

            // orderDetailData.push({
            //     ...orderDetail,
            //     toppings: orderToppings.length > 0 ? orderToppings : null,
            //     order_item_price:
            //         (orderToppings.reduce((acc, curr) => acc + parseFloat(curr.topping_price), 0) +
            //             parseFloat(orderDetail.product_price) +
            //             parseFloat(orderDetail.size_price)) *
            //         parseFloat(orderDetail.quantity),
            // });

            const productPrice = parseFloat(orderDetail.product_price) || 0;
            const sizePrice = orderDetail.size_price ? parseFloat(orderDetail.size_price) : 0;
            const toppingsPrice =
                orderToppings.length > 0
                    ? orderToppings.reduce((acc, curr) => acc + parseFloat(curr.topping_price), 0)
                    : 0;
            const quantity = parseFloat(orderDetail.quantity) || 0;

            const orderItemPrice = (toppingsPrice + productPrice + sizePrice) * quantity;

            orderDetailData.push({
                ...orderDetail,
                toppings: orderToppings.length > 0 ? orderToppings : null,
                order_item_price: orderItemPrice,
            });
        }

        const orderInfo = {
            ...orders[0],
            order_items: orderDetailData,
        };

        await pool.commit();

        return res.status(200).json({ status: 200, message: "success", data: orderInfo });
    } catch (error) {
        await pool.rollback();

        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function updateMemberExpenseInfoAfterOrdered(userId, totalPayment) {
    // MongoDB: Update member rank
    const member = await MemberRankModel.findOne({ userId });

    try {
        if (member) {
            member.orderCount += 1;
            member.expense = new mongoose.Types.Decimal128((parseFloat(member.expense) + totalPayment).toString());

            member.sixMonthOrderCount += 1;
            member.sixMonthExpense = new mongoose.Types.Decimal128(
                (parseFloat(member.sixMonthExpense) + totalPayment).toString()
            );

            member.yearlyOrderCount += 1;
            member.yearlyExpense = new mongoose.Types.Decimal128(
                (parseFloat(member.yearlyExpense) + totalPayment).toString()
            );

            await member.save();
        } else {
            // Create a new member rank if not found
            await MemberRankModel.create({
                userId: userId,
                orderCount: 1,
                expense: totalPayment,
                sixMonthOrderCount: 1,
                sixMonthExpense: totalPayment,
                yearlyOrderCount: 1,
                yearlyExpense: totalPayment,
            });
        }
        return true;
    } catch (error) {
        console.log("error: ", error);
        return false;
    }
}

function calculateNewMemberRank(member) {
    let newRank = member.rank; // Giữ nguyên rank ban đầu

    // Xét hạng dựa trên số lượng đơn hàng
    if (member.sixMonthOrderCount >= ORDER_COUNT_THRESHOLD.DIAMOND) {
        newRank = MEMBER_RANK.DIAMOND;
    } else if (member.sixMonthOrderCount >= ORDER_COUNT_THRESHOLD.GOLD) {
        newRank = MEMBER_RANK.GOLD;
    } else if (member.sixMonthOrderCount >= ORDER_COUNT_THRESHOLD.SILVER) {
        newRank = MEMBER_RANK.SILVER;
    }

    // Nếu chi tiêu đạt mức yêu cầu, nâng cấp hạng
    if (member.sixMonthExpense >= EXPENSE_THRESHOLD.DIAMOND && newRank !== MEMBER_RANK.DIAMOND) {
        newRank = MEMBER_RANK.DIAMOND;
    } else if (member.sixMonthExpense >= EXPENSE_THRESHOLD.GOLD && newRank !== MEMBER_RANK.GOLD) {
        newRank = MEMBER_RANK.GOLD;
    } else if (member.sixMonthExpense >= EXPENSE_THRESHOLD.SILVER && newRank !== MEMBER_RANK.SILVER) {
        newRank = MEMBER_RANK.SILVER;
    }

    return newRank;
}

async function updateMemberRank(userId = null) {
    if (userId) {
        const member = await MemberRankModel.findOne({ userId });

        const newRank = calculateNewMemberRank(member);

        // Nếu rank đã thay đổi, lưu lại cập nhật
        if (member.rank !== newRank) {
            member.rank = newRank;
            await member.save();
        }

        return;
    }

    const members = await MemberRankModel.find();

    for (const member of members) {
        const newRank = calculateNewMemberRank(member);

        // Nếu rank đã thay đổi, lưu lại cập nhật
        if (member.rank !== newRank) {
            member.rank = newRank;
            await member.save();
        }
    }
}

async function createOrder(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });
    try {
        const {
            order_id,
            user_id,
            total_payment,
            payment_method,
            order_status,
            order_type,
            order_note,
            shipping_cost,
            receiver_name,
            phone_number,
            address,
            store_id,
            voucher_id,
            order_items,
        } = req.body;

        let sql = "";
        let values;

        const order_date = moment().format("YYYY-MM-DD HH:mm:ss");
        await pool.beginTransaction();

        if (voucher_id && voucher_id != 0) {
            // Insert to AppliedVouchers
            await pool.query("INSERT INTO AppliedVouchers (user_id, voucher_id) VALUES (?, ?)", [user_id, voucher_id]);

            sql = `
            INSERT INTO Orders 
            (id, user_id, total_payment, payment_method, order_status, order_type, order_date, order_note, shipping_cost, receiver_name, phone_number, address, store_id, voucher_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            values = [
                order_id,
                user_id,
                total_payment,
                payment_method,
                order_status,
                order_type,
                order_date,
                order_note || null,
                shipping_cost,
                receiver_name,
                phone_number,
                address,
                store_id,
                voucher_id,
            ];
        } else {
            sql = `
            INSERT INTO Orders 
            (id, user_id, total_payment, payment_method, order_status, order_type, order_date, order_note, shipping_cost, receiver_name, phone_number, address, store_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            values = [
                order_id,
                user_id,
                total_payment,
                payment_method,
                order_status,
                order_type,
                order_date,
                order_note || null,
                shipping_cost,
                receiver_name,
                phone_number,
                address,
                store_id,
            ];
        }

        const [orderResult] = await pool.query(sql, values);

        for (const order_item of order_items) {
            await pool.query("DELETE FROM ToppingStorages WHERE cart_item_id = ?", [order_item.id]);

            const [orderDetailResult] = await pool.query(
                "INSERT INTO OrderDetails (order_id, order_item_price, product_id, size_id, quantity) VALUES (?, ?, ?, ?, ?)",
                [
                    order_id,
                    order_item.order_item_price,
                    order_item.product_id,
                    order_item.size_id || null,
                    order_item.quantity,
                ]
            );

            if (order_items?.toppings && order_item?.toppings.length > 0) {
                for (const topping of order_item.toppings) {
                    if (typeof topping === "number") {
                        await pool.query("INSERT INTO ToppingStorages (topping_id, order_detail_id) VALUES (?, ?)", [
                            topping,
                            orderDetailResult.insertId,
                        ]);
                    } else {
                        await pool.query("INSERT INTO ToppingStorages (topping_id, order_detail_id) VALUES (?, ?)", [
                            topping.topping_id,
                            orderDetailResult.insertId,
                        ]);
                    }
                }
            }
        }

        const [rows] = await pool.query(
            `SELECT Orders.*, Users.id AS user_id, Users.user_name, Users.email, Users.avatar, Stores.id AS store_id,
            Stores.store_name,
            Vouchers.id AS voucher_id,
            Vouchers.voucher_name
            FROM Orders
            LEFT JOIN Users ON Users.id = Orders.user_id 
            LEFT JOIN Vouchers ON Vouchers.id = Orders.voucher_id 
            LEFT JOIN Stores ON Stores.id = Orders.store_id 
            WHERE Orders.id = '${order_id}'`
        );

        await pool.commit();

        const result = await updateMemberExpenseInfoAfterOrdered(user_id, total_payment);

        await updateMemberRank(user_id);

        if (!result) {
            return res.status(500).json({ status: 500, message: "Failed to update member rank" });
        }

        return res.status(200).json({ status: 200, message: "success", data: rows[0] });
    } catch (error) {
        console.log(error.message);
        await pool.rollback();

        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function editOrderStatus(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });

    try {
        const order_id = req.params.id;
        const { order_status } = req.body;
        await pool.beginTransaction();

        const [result] = await pool.query("UPDATE Orders SET order_status = ? WHERE id = ?", [order_status, order_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 400, message: "Cant update order status" });
        }

        await pool.commit();

        return res.status(200).json({ status: 200, message: "success" });
    } catch (error) {
        await pool.rollback();

        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

export { createOrder, getOrders, getOrderInfo, editOrderStatus, getUserOrders };
