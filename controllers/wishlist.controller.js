import connectToDB from "../config/db.js";

async function getUserWishList(req, res) {
    const pool = await connectToDB();

    try {
        await pool.beginTransaction();
        const user_id = req.params.user_id;

        const [rows] = await pool.query(
            `SELECT * FROM WishList WHERE user_id = '${user_id}'`
        );

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

async function addToWishList(req, res) {
    const pool = await connectToDB();

    try {
        const { product_id, user_id } = req.body;

        await pool.beginTransaction();

        const [result] = await pool.query(
            "INSERT INTO WishList (product_id, user_id) VALUES (?, ?)",
            [product_id, user_id]
        );

        const [rows] = await pool.query(
            `SELECT * FROM WishList WHERE id = '${result.insertId}'`
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

async function deleteItemInWishList(req, res) {
    const pool = await connectToDB();

    try {
        const wishlist_item_id = req.params.id;

        const [result] = await pool.query(
            `DELETE FROM WishList WHERE id = '${wishlist_item_id}'`
        );

        if (result.affectedRows === 0) {
            return res
                .status(400)
                .json({ status: 400, message: "Delete from wishlist failed" });
        }

        return res.status(200).json({
            status: 200,
            message: "Delete from wishlist successfully",
        });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        await pool.end();
    }
}

export { getUserWishList, deleteItemInWishList, addToWishList };
