import connectToDB from "../config/db.js";

const MIN_STAR_RATING = 1;
const MAX_STAR_RATING = 5;

async function getReviews(req, res) {
    const pool = await connectToDB();

    try {
        const rating = req.query.rating;
        let query = `SELECT * FROM Reviews ORDER BY review_date DESC`;

        if (rating && rating > MIN_STAR_RATING && rating <= MAX_STAR_RATING) {
            query = `SELECT * FROM Reviews WHERE rating = '${rating}' ORDER BY review_date DESC`;
        }

        const [rows] = await pool.query(query);

        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        await pool.end();
    }
}

async function getProductReviews(req, res) {
    const pool = await connectToDB();

    try {
        await pool.beginTransaction();

        const product_id = req.params.product_id;
        const rating = req.query.rating;

        const [orderDetailsRows] = await pool.query(
            `
            SELECT od.*, p.id AS product_id, p.name, p.image
            FROM OrderDetails AS od
            JOIN Products AS p ON od.product_id = p.id
            WHERE od.product_id = ?
            `,
            [product_id]
        );

        if (orderDetailsRows.length === 0) {
            return res.status(404).json({
                status: 404,
                error: "No orders found for this product",
            });
        }

        const orderIds = orderDetailsRows.map((row) => row.order_id);

        let query = `SELECT * FROM Reviews WHERE order_id IN (?)`;

        if (rating && rating > MIN_STAR_RATING && rating <= MAX_STAR_RATING) {
            query = `SELECT * FROM Reviews WHERE rating = '${rating}' AND order_id IN (?) ORDER BY review_date DESC`;
        }

        const [rows] = await pool.query(query, [orderIds]);

        for (let review of rows) {
            const order_products = orderDetailsRows.filter(
                (orderDetail) => orderDetail.order_id === review.order_id
            );
            review.order_products = order_products;
        }

        await pool.commit();
        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows });
    } catch (error) {
        await pool.rollback();
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        await pool.end();
    }
}

async function createReview(req, res) {
    const pool = await connectToDB();

    try {
        await pool.beginTransaction();

        const { content, rating, review_date, order_id, user_id } = req.body;
        const [result] = await pool.query(
            "INSERT INTO Reviews (content, rating, review_date, order_id, user_id) VALUES (?, ?, ?, ?, ?)",
            [content, rating, review_date, order_id, user_id]
        );

        const [rows] = await pool.query(
            `SELECT * FROM Reviews WHERE id = '${result.insertId}'`
        );

        await pool.commit();
        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows[0] });
    } catch (error) {
        await pool.rollback();
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        await pool.end();
    }
}

export { getReviews, getProductReviews, createReview };
