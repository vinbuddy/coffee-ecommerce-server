import connectToDB from "../config/db.js";

async function createCategory(req, res) {
    const pool = await connectToDB();

    try {
        const { category_name } = req.body;

        const [result] = await pool.query(
            "INSERT INTO Categories (category_name) VALUES (?)",
            [category_name]
        );

        const [rows] = await pool.query(
            `SELECT * FROM Categories WHERE id = '${result.insertId}'`
        );
        await pool.end();
        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows[0] });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
}

async function editCategory(req, res) {
    const pool = await connectToDB();

    try {
        const { category_name } = req.body;
        const category_id = req.params.id;

        const [result] = await pool.query(
            "UPDATE Categories SET category_name = ? WHERE id = ?",
            [category_name, category_id]
        );

        if (result.affectedRows === 0) {
            await pool.end();
            return res
                .status(200)
                .json({ status: 200, message: "Update category failed" });
        }

        const [rows] = await pool.query(
            `SELECT * FROM Categories WHERE id = '${category_id}'`
        );
        await pool.end();
        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows[0] });
    } catch (error) {
        await pool.end();
        return res.status(500).json({ status: 500, message: error.message });
    }
}

async function getCategories(req, res) {
    const pool = await connectToDB();
    try {
        const [rows, fields] = await pool.execute("SELECT * FROM Categories");
        await pool.end();
        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows });
    } catch (error) {
        await pool.end();

        return res.status(500).json({ status: 500, message: error.message });
    }
}

export { createCategory, getCategories, editCategory };
