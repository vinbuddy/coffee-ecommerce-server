import connectToDB from "../config/db.js";

async function getVouchers(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });
    try {
        const [vouchers] = await pool.query("SELECT * FROM Vouchers");

        const data = [];

        for (const voucher of vouchers) {
            let applicable_stores = [];
            let applicable_products = [];
            let applicable_users = [];
            if (voucher.applicable_stores.length > 0) {
                const [rows] = await pool.query("SELECT * FROM Stores WHERE id IN (?)", [voucher.applicable_stores]);

                applicable_stores = rows;
            }

            if (voucher.applicable_products.length > 0) {
                const [rows] = await pool.query("SELECT * FROM Products WHERE id IN (?)", [
                    voucher.applicable_products,
                ]);

                applicable_products = rows;
            }

            if (voucher.applicable_users.length > 0) {
                const [rows] = await pool.query("SELECT * FROM Users WHERE id IN (?)", [voucher.applicable_users]);

                applicable_users = rows;
            }

            data.push({
                ...voucher,
                applicable_stores: applicable_stores,
                applicable_products: applicable_products,
                applicable_users: applicable_users,
            });
        }

        if (pool) await pool.end();
        return res.status(200).json({ status: 200, message: "success", data: data });
    } catch (error) {
        if (pool) await pool.end();

        return res.status(500).json({ status: 500, message: error.message });
    }
}

async function getVoucher(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });
    try {
        const voucher_id = req.params.id;
        const [vouchers] = await pool.query(`SELECT * FROM Vouchers WHERE id = '${voucher_id}'`);

        let applicable_stores = [];
        let applicable_products = [];
        let applicable_users = [];

        if (vouchers[0].applicable_stores.length > 0) {
            const [rows] = await pool.query("SELECT * FROM Stores WHERE id IN (?)", [vouchers[0].applicable_stores]);

            applicable_stores = rows;
        }

        if (vouchers[0].applicable_products.length > 0) {
            const [rows] = await pool.query("SELECT * FROM Products WHERE id IN (?)", [
                vouchers[0].applicable_products,
            ]);

            applicable_products = rows;
        }

        if (vouchers[0].applicable_users.length > 0) {
            const [rows] = await pool.query("SELECT * FROM Users WHERE id IN (?)", [vouchers[0].applicable_users]);

            applicable_users = rows;
        }

        const data = {
            ...vouchers[0],
            applicable_stores: applicable_stores,
            applicable_products: applicable_products,
            applicable_users: applicable_users,
        };

        return res.status(200).json({ status: 200, message: "success", data: data });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
}

async function getUserVouchers(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });
    const user_id = req.params.user_id;
    try {
        const [vouchers] = await pool.query(
            "SELECT * FROM Vouchers WHERE JSON_CONTAINS(applicable_users, ?) AND id NOT IN (SELECT voucher_id FROM AppliedVouchers WHERE user_id = ?)",
            [JSON.stringify(user_id), user_id]
        );

        const data = [];

        for (const voucher of vouchers) {
            let applicable_stores = [];
            let applicable_products = [];
            let applicable_users = [];
            if (voucher.applicable_stores.length > 0) {
                const [rows] = await pool.query("SELECT * FROM Stores WHERE id IN (?)", [voucher.applicable_stores]);

                applicable_stores = rows;
            }

            if (voucher.applicable_products.length > 0) {
                const [rows] = await pool.query("SELECT * FROM Products WHERE id IN (?)", [
                    voucher.applicable_products,
                ]);

                applicable_products = rows;
            }

            if (voucher.applicable_users.length > 0) {
                const [rows] = await pool.query("SELECT * FROM Users WHERE id IN (?)", [voucher.applicable_users]);

                applicable_users = rows;
            }

            data.push({
                ...voucher,
                applicable_stores: applicable_stores,
                applicable_products: applicable_products,
                applicable_users: applicable_users,
            });
        }

        return res.status(200).json({ status: 200, message: "success", data: data });
    } catch (error) {
        if (pool) await pool.end();

        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function createVoucher(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });
    const {
        voucher_name,
        description,
        start_date,
        end_date,
        image,
        discount_type,
        discount_price,
        min_order_price,
        applicable_stores,
        applicable_products,
        applicable_users,
    } = req.body;

    const _applicable_stores = applicable_stores ? JSON.stringify(applicable_stores) : null;
    const _applicable_users = applicable_users ? JSON.stringify(applicable_users) : null;
    const _applicable_products = applicable_products ? JSON.stringify(applicable_products) : null;

    try {
        await pool.beginTransaction();
        const [result] = await pool.query(
            "INSERT INTO Vouchers (voucher_name, description, start_date, end_date, image, discount_type, discount_price, min_order_price, applicable_stores, applicable_products, applicable_users) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                voucher_name,
                description,
                start_date,
                end_date,
                image,
                discount_type,
                discount_price,
                min_order_price || 0,
                _applicable_stores,
                _applicable_products,
                _applicable_users,
            ]
        );

        const [vouchers] = await pool.query(`SELECT * FROM Vouchers WHERE id = '${result.insertId}'`);

        let applicable_stores = [];
        let applicable_products = [];
        let applicable_users = [];

        if (vouchers[0].applicable_stores.length > 0) {
            const [rows] = await pool.query("SELECT * FROM Stores WHERE id IN (?)", [vouchers[0].applicable_stores]);

            applicable_stores = rows;
        }

        if (vouchers[0].applicable_products.length > 0) {
            const [rows] = await pool.query("SELECT * FROM Products WHERE id IN (?)", [
                vouchers[0].applicable_products,
            ]);

            applicable_products = rows;
        }

        if (vouchers[0].applicable_users.length > 0) {
            const [rows] = await pool.query("SELECT * FROM Users WHERE id IN (?)", [vouchers[0].applicable_users]);

            applicable_users = rows;
        }

        const data = {
            ...vouchers[0],
            applicable_stores: applicable_stores,
            applicable_products: applicable_products,
            applicable_users: applicable_users,
        };

        await pool.commit();

        return res.status(200).json({ status: 200, message: "success", data: data });
    } catch (error) {
        await pool.rollback();

        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function editVoucher(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });

    const voucher_id = req.params.id;

    const {
        voucher_name,
        description,
        start_date,
        end_date,
        image,
        discount_type,
        discount_price,
        min_order_price,
        applicable_stores,
        applicable_products,
        applicable_users,
    } = req.body;

    const _applicable_stores = JSON.stringify(applicable_stores);
    const _applicable_users = JSON.stringify(applicable_users);
    const _applicable_products = JSON.stringify(applicable_products);

    try {
        const [result] = await pool.query(
            "UPDATE Vouchers SET voucher_name = ?, description = ?, start_date = ?, end_date = ?, image = ?, discount_type = ?, discount_price = ?, min_order_price = ?, applicable_stores = ?, applicable_products = ?, applicable_users = ? WHERE id = ?",
            [
                voucher_name,
                description,
                start_date,
                end_date,
                image,
                discount_type,
                discount_price,
                min_order_price || 0,
                _applicable_stores,
                _applicable_products,
                _applicable_users,
                voucher_id,
            ]
        );

        const [vouchers] = await pool.query(`SELECT * FROM Vouchers WHERE id = '${voucher_id}'`);

        let applicable_stores = [];
        let applicable_products = [];
        let applicable_users = [];

        if (vouchers[0].applicable_stores.length > 0) {
            const [rows] = await pool.query("SELECT * FROM Stores WHERE id IN (?)", [vouchers[0].applicable_stores]);

            applicable_stores = rows;
        }

        if (vouchers[0].applicable_products.length > 0) {
            const [rows] = await pool.query("SELECT * FROM Products WHERE id IN (?)", [
                vouchers[0].applicable_products,
            ]);

            applicable_products = rows;
        }

        if (vouchers[0].applicable_users.length > 0) {
            const [rows] = await pool.query("SELECT * FROM Users WHERE id IN (?)", [vouchers[0].applicable_users]);

            applicable_users = rows;
        }

        const data = {
            ...vouchers[0],
            applicable_stores: applicable_stores,
            applicable_products: applicable_products,
            applicable_users: applicable_users,
        };

        return res.status(200).json({ status: 200, message: "success", data: data });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function createMemberVoucher(req, res) {
    try {
        const {
            voucher_name,
            description,
            start_date,
            end_date,
            image,
            discount_type,
            discount_price,
            min_order_price,
            applicable_stores,
            applicable_products,
            applicable_users,
        } = req.body;

        return res.status(200).json({ message: "create member voucher successfully" });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
}

export { getVouchers, getVoucher, getUserVouchers, createVoucher, editVoucher };
