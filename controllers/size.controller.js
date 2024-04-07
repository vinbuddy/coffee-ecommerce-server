import connectToDB from "../config/db.js";

async function createSize(req, res) {
    const pool = await connectToDB();

    try {
        const { size_name } = req.body;

        const [result] = await pool.query(
            "INSERT INTO Sizes (size_name) VALUES (?)",
            [size_name]
        );

        const [rows] = await pool.query(
            `SELECT * FROM Sizes WHERE id = '${result.insertId}'`
        );

        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows[0] });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function getSizes(req, res) {
    const pool = await connectToDB();
    try {
        const [rows, fields] = await pool.execute("SELECT * FROM Sizes");

        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

export { createSize, getSizes };
