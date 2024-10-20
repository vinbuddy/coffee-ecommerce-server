import connectToDB from "../config/db.js";

async function createCategory(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });

    try {
        const { category_name } = req.body;

        const [result] = await pool.query("INSERT INTO Categories (category_name) VALUES (?)", [category_name]);

        const [rows] = await pool.query(`SELECT * FROM Categories WHERE id = '${result.insertId}'`);
        if (pool) await pool.end();
        return res.status(200).json({ status: 200, message: "success", data: rows[0] });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
}

async function editCategory(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });

    try {
        const { category_name } = req.body;
        const category_id = req.params.id;

        const [result] = await pool.query("UPDATE Categories SET category_name = ? WHERE id = ?", [
            category_name,
            category_id,
        ]);

        if (result.affectedRows === 0) {
            if (pool) await pool.end();
            return res.status(200).json({ status: 200, message: "Update category failed" });
        }

        const [rows] = await pool.query(`SELECT * FROM Categories WHERE id = '${category_id}'`);
        if (pool) await pool.end();
        return res.status(200).json({ status: 200, message: "success", data: rows[0] });
    } catch (error) {
        if (pool) await pool.end();
        return res.status(500).json({ status: 500, message: error.message });
    }
}

async function getCategories(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });
    try {
        const [rows, fields] = await pool.execute(
            "SELECT * FROM Categories WHERE is_deleted IS NULL OR is_deleted = 0"
        );

        if (pool) await pool.end();
        return res.status(200).json({ status: 200, message: "success", data: rows });
    } catch (error) {
        if (pool) await pool.end();

        return res.status(500).json({ status: 500, message: error.message });
    }
}

async function deleteCategory(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });

    try {
        const category_id = req.params.id;

        await pool.query(`UPDATE Categories SET is_deleted = 1 WHERE id = '${category_id}'`);

        await pool.commit();

        return res.status(200).json({ status: 200, message: "success" });
    } catch (error) {
        await pool.rollback();

        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

export { createCategory, getCategories, editCategory, deleteCategory };
