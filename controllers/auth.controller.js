import connectToDB from "../config/db.js";

async function socialRegister(req, res) {
    const data = req.body;

    let role_id = null;
    let isExisted = false;

    const pool = await connectToDB();

    try {
        const [rows, fields] = await pool.execute(
            `SELECT * FROM Users WHERE id = '${data.id}'`
        );

        if (rows && rows.length) {
            isExisted = true;
            return res.status(200).json({
                status: 200,
                message: "Account is already existed",
            });
        }
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }

    try {
        // Not exist -> create user
        if (!isExisted) {
            // role query
            const [rows, fields] = await pool.execute(
                "SELECT id FROM Roles WHERE role_name = 'user'"
            );

            if (rows && rows.length > 0) {
                role_id = rows[0].id;
            }

            // Insert user
            const [users, userFields] = await pool.execute(
                "INSERT INTO Users (id, user_name, email, account_type, avatar, role_id) VALUES (?,?,?,?,?,?)",
                [
                    data.id,
                    data.user_name,
                    data.email,
                    data.account_type,
                    data.avatar,
                    role_id,
                ]
            );

            return res
                .status(200)
                .json({ status: 200, message: "success", data: users });
        }
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }

    await pool.end();
}

export { socialRegister };
