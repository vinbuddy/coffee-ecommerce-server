import connectToDB from "../config/db.js";
import moment from "moment";

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

// async function getUserOrders(req, res) {
//     const pool = await connectToDB();
//     if (!pool)
//         return res.status(500).json({
//             status: 500,
//             message: "Failed to connect to the database",
//         });
//     const user_id = req.params.user_id;

//     try {
//         const [orders] = await pool.query(
//             `SELECT Orders.*, Users.id AS user_id, Users.user_name, Users.email, Users.avatar, Stores.id AS store_id,
//             Stores.store_name,
//             Vouchers.id AS voucher_id,
//             Vouchers.voucher_name
//             FROM Orders
//             LEFT JOIN Users ON Users.id = Orders.user_id
//             LEFT JOIN Stores ON Stores.id = Orders.store_id
//             LEFT JOIN Vouchers ON Vouchers.id = Orders.voucher_id
//             WHERE Orders.user_id = '${user_id}'
//             ORDER BY Orders.order_date DESC`
//         );

//         const orderData = [];

//         for (let orderItem of orders) {
//             const [orderDetails] = await pool.query(
//                 `SELECT
//                 od.id,
//                 p.id AS product_id,
//                 p.name AS product_name,
//                 p.price AS product_price,
//                 p.image AS product_image,
//                 s.size_name AS size_name,
//                 ps.size_price AS size_price,
//                 od.quantity AS quantity
//                 FROM
//                     OrderDetails od
//                 LEFT JOIN
//                     Products p ON od.product_id = p.id
//                 LEFT JOIN
//                     ProductSizes ps ON od.product_id = ps.product_id AND od.size_id = ps.size_id
//                 LEFT JOIN
//                     Sizes s ON od.size_id = s.id
//                 WHERE
//                     od.order_id = '${orderItem.id}'
//                 GROUP BY
//                     od.id, p.name, p.price, p.image, s.size_name, ps.size_price, od.quantity;`
//             );

//             orderData.push({
//                 ...orderItem,
//                 order_items: orderDetails,
//             });
//         }

//         for (const orderItem of orderData) {
//             // Check isReviewed for each order item
//             const [reviews] = await pool.query(`SELECT * FROM Reviews WHERE order_id = '${orderItem.id}'`);
//             orderItem["is_reviewed"] = reviews.length > 0;

//             for (const orderDetail of orderItem.order_items) {
//                 const [orderToppings] = await pool.query(
//                     `SELECT
//                     ts.id AS topping_storage_id,
//                     t.topping_name,
//                     t.topping_price
//                     FROM
//                         ToppingStorages ts
//                     LEFT JOIN
//                         Toppings t ON ts.topping_id = t.id
//                     WHERE
//                         ts.order_detail_id = '${orderDetail.id}' `
//                 );

//                 orderDetail["toppings"] = orderToppings.length > 0 ? orderToppings : null;
//                 orderDetail["order_item_price"] =
//                     (orderToppings.reduce((acc, curr) => acc + parseFloat(curr.topping_price), 0) +
//                         parseFloat(orderDetail.product_price) +
//                         parseFloat(orderDetail.size_price)) *
//                     parseFloat(orderDetail.quantity);
//             }
//         }

//         return res.status(200).json({ status: 200, message: "success", data: orderData });
//     } catch (error) {
//         return res.status(500).json({ status: 500, message: error.message });
//     } finally {
//         if (pool) await pool.end();
//     }
// }

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

        const orderData = orders.map((order) => {
            const orderItems = orderDetailsMap[order.id] || [];
            orderItems.forEach((item) => {
                const toppings = orderToppingsMap[item.id] || [];
                item.toppings = toppings.length > 0 ? toppings : null;
                item.order_item_price =
                    (toppings.reduce((acc, curr) => acc + parseFloat(curr.topping_price), 0) +
                        parseFloat(item.product_price) +
                        parseFloat(item.size_price)) *
                    parseFloat(item.quantity);
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
                od.id, p.name, p.price, p.image, s.size_name, ps.size_price, od.quantity;`
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
                    ts.order_detail_id = '${orderDetail.order_id}' `
            );

            orderDetailData.push({
                ...orderDetail,
                toppings: orderToppings.length > 0 ? orderToppings : null,
                order_item_price:
                    (orderToppings.reduce((acc, curr) => acc + parseFloat(curr.topping_price), 0) +
                        parseFloat(orderDetail.product_price) +
                        parseFloat(orderDetail.size_price)) *
                    parseFloat(orderDetail.quantity),
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

        if (voucher_id) {
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

        // Insert into order details tables
        for (const order_item of order_items) {
            // Delete associated ToppingStorages
            await pool.query("DELETE FROM ToppingStorages WHERE cart_item_id = ?", [order_item.id]);

            const [orderDetailResult] = await pool.query(
                "INSERT INTO OrderDetails (order_id, order_item_price, product_id, size_id, quantity) VALUES (?, ?, ?, ?, ?)",
                [order_id, order_item.order_item_price, order_item.product_id, order_item.size_id, order_item.quantity]
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

        return res.status(200).json({ status: 200, message: "success", data: rows[0] });
    } catch (error) {
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
