import connectToDB from "../config/db.js";

async function getUsers(req, res) {
    const pool = await connectToDB();

    try {
        const [rows, fields] = await pool.execute("SELECT * FROM Users");
        await pool.end();
        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows });
    } catch (error) {
        await pool.end();

        return res.status(500).json({ status: 500, message: error.message });
    }
}

async function getUser(req, res) {
    const user_id = req.params.id;
    const pool = await connectToDB();

    try {
        const [rows, fields] = await pool.execute(
            `SELECT * FROM Users WHERE id = '${user_id}'`
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

export { getUsers, getUser };
