import connectToDB from "../config/db.js";
import { ORDER_STATUS } from "../utils/constant.js";

async function getAdminRevenue(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });
    try {
        const { day, month, year } = req.query;

        let query = `
        SELECT SUM(total_payment) AS total_revenue 
        FROM Orders 
        WHERE order_status = '${ORDER_STATUS.COMPLETED}'
        `;

        const queryParams = [];

        if (year) {
            query += " AND YEAR(order_date) = ?";
            queryParams.push(year);
        }
        if (month) {
            query += " AND MONTH(order_date) = ?";
            queryParams.push(month);
        }
        if (day) {
            query += " AND DAY(order_date) = ?";
            queryParams.push(day);
        }

        const [rows] = await pool.query(query, queryParams);

        return res.status(200).json({
            status: 200,
            message: "success",
            data: rows[0],
        });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function getStoreRevenue(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });
    try {
        const { day, month, year, storeId } = req.query;

        let query = `
        SELECT SUM(total_payment) AS total_revenue 
        FROM Orders 
        WHERE order_status = '${ORDER_STATUS.COMPLETED}'  AND store_id = ?
        `;

        const queryParams = [storeId];

        if (year) {
            query += " AND YEAR(order_date) = ?";
            queryParams.push(year);
        }
        if (month) {
            query += " AND MONTH(order_date) = ?";
            queryParams.push(month);
        }
        if (day) {
            query += " AND DAY(order_date) = ?";
            queryParams.push(day);
        }

        const [rows] = await pool.query(query, queryParams);

        return res.status(200).json({
            status: 200,
            message: "success",
            data: rows[0],
        });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

export { getAdminRevenue, getStoreRevenue };
