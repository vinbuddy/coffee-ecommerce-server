import connectToDB from "../config/db.js";

async function getUsers(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });

    try {
        const [rows, fields] = await pool.execute("SELECT * FROM Users");

        return res.status(200).json({ status: 200, message: "success", data: rows });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function getUser(req, res) {
    const user_id = req.params.id;
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });

    try {
        const [rows, fields] = await pool.execute(`SELECT * FROM Users WHERE id = '${user_id}'`);

        return res.status(200).json({ status: 200, message: "success", data: rows[0] });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function getUserByEmailOrPhone(req, res) {
    const email = req.query.email;
    const phone = req.query.phone;

    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });

    try {
        const [rows, fields] = await pool.execute(
            `SELECT * FROM Users WHERE email = '${email}' OR phone_number = '${phone}'`
        );

        return res.status(200).json({ status: 200, message: "success", data: rows[0] });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function updateProfile(req, res) {
    const user_id = req.params.id;
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });

    try {
        const { user_name, avatar } = req.body;

        let sql = `UPDATE Users SET user_name = '${user_name}', avatar = '${avatar}' WHERE id = '${user_id}'`;

        if (user_name && !avatar) {
            sql = `UPDATE Users SET user_name = '${user_name}' WHERE id = '${user_id}'`;
        } else if (!user_name && avatar) {
            sql = `UPDATE Users SET avatar = '${avatar}' WHERE id = '${user_id}'`;
        }

        await pool.execute(sql);

        const [rows, fields] = await pool.execute(`SELECT * FROM Users WHERE id = '${user_id}'`);

        return res.status(200).json({ status: 200, message: "success", data: rows[0] });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

export { getUsers, getUser, updateProfile, getUserByEmailOrPhone };
