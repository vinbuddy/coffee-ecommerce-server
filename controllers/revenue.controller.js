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

        let query = "";
        const queryParams = [];

        if (year && !month && !day) {
            // Revenue by month for a given year
            query = `
                SELECT MONTH(order_date) AS period, SUM(total_payment) AS total_revenue 
                FROM Orders 
                WHERE order_status = '${ORDER_STATUS.COMPLETED}' AND YEAR(order_date) = ?
                GROUP BY MONTH(order_date)
            `;
            queryParams.push(year);
        } else if (year && month && !day) {
            // Revenue by day for a given month and year
            query = `
                SELECT DAY(order_date) AS period, SUM(total_payment) AS total_revenue 
                FROM Orders 
                WHERE order_status = '${ORDER_STATUS.COMPLETED}' AND YEAR(order_date) = ? AND MONTH(order_date) = ?
                GROUP BY DAY(order_date)
            `;
            queryParams.push(year, month);
        } else if (year && month && day) {
            // Revenue for a specific day
            query = `
                SELECT SUM(total_payment) AS total_revenue 
                FROM Orders 
                WHERE order_status = '${ORDER_STATUS.COMPLETED}' AND YEAR(order_date) = ? AND MONTH(order_date) = ? AND DAY(order_date) = ?
            `;
            queryParams.push(year, month, day);
        } else {
            return res.status(400).json({ status: 400, message: "Please provide a valid date filter" });
        }

        const [rows] = await pool.query(query, queryParams);

        return res.status(200).json({
            status: 200,
            message: "success",
            data: rows,
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

        if (!storeId) {
            return res.status(400).json({ status: 400, message: "storeId is required" });
        }

        let query = "";
        const queryParams = [storeId];

        if (year && !month && !day) {
            // Revenue by month for a given year
            query = `
                SELECT MONTH(order_date) AS period, SUM(total_payment) AS total_revenue 
                FROM Orders 
                WHERE order_status = '${ORDER_STATUS.COMPLETED}' AND store_id = ? AND YEAR(order_date) = ?
                GROUP BY MONTH(order_date)
            `;
            queryParams.push(year);
        } else if (year && month && !day) {
            // Revenue by day for a given month and year
            query = `
                SELECT DAY(order_date) AS period, SUM(total_payment) AS total_revenue 
                FROM Orders 
                WHERE order_status = '${ORDER_STATUS.COMPLETED}' AND store_id = ? AND YEAR(order_date) = ? AND MONTH(order_date) = ?
                GROUP BY DAY(order_date)
            `;
            queryParams.push(year, month);
        } else if (year && month && day) {
            // Revenue for a specific day
            query = `
                SELECT SUM(total_payment) AS total_revenue 
                FROM Orders 
                WHERE order_status = '${ORDER_STATUS.COMPLETED}' AND store_id = ? AND YEAR(order_date) = ? AND MONTH(order_date) = ? AND DAY(order_date) = ?
            `;
            queryParams.push(year, month, day);
        } else {
            return res.status(400).json({ status: 400, message: "Please provide a valid date filter" });
        }

        const [rows] = await pool.query(query, queryParams);

        return res.status(200).json({
            status: 200,
            message: "success",
            data: rows,
        });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

export { getAdminRevenue, getStoreRevenue };
