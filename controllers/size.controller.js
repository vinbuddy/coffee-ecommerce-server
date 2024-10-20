import connectToDB from "../config/db.js";

async function createSize(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });

    try {
        const { size_name } = req.body;

        const [result] = await pool.query("INSERT INTO Sizes (size_name) VALUES (?)", [size_name]);

        const [rows] = await pool.query(`SELECT * FROM Sizes WHERE id = '${result.insertId}'`);

        return res.status(200).json({ status: 200, message: "success", data: rows[0] });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function getSizes(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });
    try {
        const [rows, fields] = await pool.execute("SELECT * FROM Sizes WHERE is_deleted IS NULL OR is_deleted = 0");

        return res.status(200).json({ status: 200, message: "success", data: rows });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function deleteSize(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });

    try {
        const size_id = req.params.id;

        await pool.query(`UPDATE Sizes SET is_deleted = 1 WHERE id = '${size_id}'`);

        await pool.commit();

        return res.status(200).json({ status: 200, message: "success" });
    } catch (error) {
        await pool.rollback();

        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function editSize(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });

    try {
        const { size_name } = req.body;
        const size_id = req.params.id;

        const [result] = await pool.query("UPDATE Sizes SET size_name = ? WHERE id = ?", [size_name, size_id]);

        if (result.affectedRows === 0) {
            return res.status(200).json({ status: 200, message: "Update size failed" });
        }

        const [rows] = await pool.query(`SELECT * FROM Sizes WHERE id = '${size_id}'`);

        return res.status(200).json({ status: 200, message: "success", data: rows[0] });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

export { createSize, getSizes, deleteSize, editSize };
