import connectToDB from "../config/db.js";

async function createSize(req, res) {
    const pool = await connectToDB();

    try {
        const { size_name } = req.body;

        const [rows, field] = await pool.query(
            "INSERT INTO Sizes (size_name) VALUES (?)",
            [size_name]
        );

        await pool.end();
        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
}

async function getSizes(req, res) {
    const pool = await connectToDB();
    try {
        const [rows, fields] = await pool.execute("SELECT * FROM Sizes");
        await pool.end();
        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows });
    } catch (error) {
        await pool.end();

        return res.status(500).json({ status: 500, message: error.message });
    }
}

export { createSize, getSizes };
