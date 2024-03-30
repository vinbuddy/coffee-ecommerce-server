import connectToDB from "../config/db.js";
import bcrypt from "bcrypt";

async function createUserAccount(req, res) {
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
            const [result] = await pool.execute(
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

            const [users] = await pool.query(
                `SELECT * FROM Users WHERE id = '${data.id}'`
            );

            return res
                .status(200)
                .json({ status: 200, message: "success", data: users });
        }
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        await pool.end();
    }
}

async function loginToStore(req, res) {
    const pool = await connectToDB();
    try {
        const { store_id, password } = req.body;

        const [store_accounts] = await pool.query(
            `SELECT * FROM StoreAccounts WHERE store_id = '${store_id}'`
        );
        const originPassword = await bcrypt.compare(
            password.toString(),
            store_accounts[0].password
        );

        if (!store_accounts[0]) {
            return res.status(404).send("Account is not existed");
        }

        if (!originPassword) {
            return res
                .status(404)
                .send({ status: 404, message: "Password is not valid" });
        }

        return res
            .status(200)
            .json({ status: 200, message: "success", data: store_accounts[0] });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        await pool.end();
    }
}

async function createStoreAccount(req, res) {
    const pool = await connectToDB();
    try {
        const { store_id, password } = req.body;

        const salt = await bcrypt.genSalt(10);
        const passwordHashed = await bcrypt.hash(password.toString(), salt);

        const [result] = await pool.query(
            "INSERT INTO StoreAccounts (store_id, password) VALUES (?, ?)",
            [store_id, passwordHashed]
        );

        return res.status(200).json({
            status: 200,
            message: "success",
        });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        await pool.end();
    }
}

export { createUserAccount, loginToStore, createStoreAccount };
