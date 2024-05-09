import connectToDB from "../config/db.js";
import moment from "moment";

const MIN_STAR_RATING = 1;
const MAX_STAR_RATING = 5;

async function getReviews(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });

    try {
        const rating = req.query.rating;
        let query = `SELECT 
            Reviews.id, Reviews.order_id, Reviews.content, Reviews.rating, Reviews.review_date, 
            Users.user_name, Users.email, Users.avatar
            FROM Reviews
            LEFT JOIN Users ON Reviews.user_id = Users.id
            ORDER BY Reviews.review_date DESC`;

        if (rating && rating > MIN_STAR_RATING && rating <= MAX_STAR_RATING) {
            query = `
                SELECT Reviews.id, Reviews.order_id, Reviews.content, Reviews.rating, Reviews.review_date, 
                Users.user_name, Users.email, Users.avatar
                FROM Reviews
                LEFT JOIN Users ON Reviews.user_id = Users.id
                WHERE Reviews.rating = '${rating}'
                ORDER BY Reviews.review_date DESC
            `;
        }

        const [reviews] = await pool.query(query);

        for (let review of reviews) {
            const [orderProducts] = await pool.query(
                `SELECT Products.id AS product_id, Products.name AS product_name, Products.price AS product_price, Products.image AS product_image
                FROM OrderDetails 
                LEFT JOIN Products ON OrderDetails.product_id = Products.id
                WHERE OrderDetails.order_id = '${review.order_id}'`
            );

            review["order_products"] = orderProducts;
        }

        return res.status(200).json({ status: 200, message: "success", data: reviews });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function getProductReviews(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });

    try {
        await pool.beginTransaction();

        const product_id = req.params.product_id;
        const rating = req.query.rating;

        const [orderDetailsRows] = await pool.query(
            `
            SELECT OrderDetails.order_id, Products.id AS product_id, Products.name AS product_name, Products.price AS product_price, Products.image AS product_image
                FROM OrderDetails 
                LEFT JOIN Products ON OrderDetails.product_id = Products.id
                WHERE OrderDetails.product_id = '${product_id}'
            `
        );

        if (orderDetailsRows.length === 0) {
            return res.status(404).json({
                status: 404,
                error: "No orders found for this product",
            });
        }

        const orderIds = orderDetailsRows.map((row) => row.order_id);

        let query = `SELECT 
                    Reviews.id, Reviews.order_id, Reviews.content, Reviews.rating, Reviews.review_date, 
                    Users.user_name, Users.email, Users.avatar
                    FROM Reviews
                    LEFT JOIN Users ON Reviews.user_id = Users.id
                    WHERE order_id IN (?)
                    ORDER BY Reviews.review_date DESC`;

        if (rating && rating > MIN_STAR_RATING && rating <= MAX_STAR_RATING) {
            query = `SELECT 
            Reviews.id, Reviews.order_id, Reviews.content, Reviews.rating, Reviews.review_date, 
            Users.user_name, Users.email, Users.avatar
            FROM Reviews
            LEFT JOIN Users ON Reviews.user_id = Users.id
            WHERE rating = '${rating}' AND order_id IN (?)
            ORDER BY Reviews.review_date DESC`;
        }

        const [rows] = await pool.query(query, [orderIds]);

        for (let review of rows) {
            const order_products = orderDetailsRows.filter((orderDetail) => orderDetail.order_id === review.order_id);

            // exclude order_id from the product details
            review["order_products"] = order_products.map(({ order_id, ...rest }) => rest);
        }

        await pool.commit();
        return res.status(200).json({ status: 200, message: "success", data: rows });
    } catch (error) {
        await pool.rollback();
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function createReview(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });

    try {
        await pool.beginTransaction();

        const { content, rating, order_id, user_id } = req.body;
        const review_date = moment().format("YYYY-MM-DD HH:mm:ss");
        const [result] = await pool.query(
            "INSERT INTO Reviews (content, rating, review_date, order_id, user_id) VALUES (?, ?, ?, ?, ?)",
            [content, rating, review_date, order_id, user_id]
        );

        let query = `SELECT 
                    Reviews.id, Reviews.order_id, Reviews.content, Reviews.rating, Reviews.review_date, 
                    Users.user_name, Users.email, Users.avatar
                    FROM Reviews
                    LEFT JOIN Users ON Reviews.user_id = Users.id
                    WHERE Reviews.id = '${result.insertId}'
                    ORDER BY Reviews.review_date DESC`;

        const [rows] = await pool.query(query);

        await pool.commit();
        return res.status(200).json({ status: 200, message: "success", data: rows[0] });
    } catch (error) {
        await pool.rollback();
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

export { getReviews, getProductReviews, createReview };
