import connectToDB from "../config/db.js";

async function createCategory(req, res) {
    const pool = await connectToDB();

    try {
        const { category_name } = req.body;

        const [rows, field] = await pool.query(
            "INSERT INTO Categories (category_name) VALUES (?)",
            [category_name]
        );

        await pool.end();
        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows });
    } catch (error) {
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

export { createCategory, getCategories };
