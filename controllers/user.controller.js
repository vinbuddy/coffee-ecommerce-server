// import pool from "../config/db.js";
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

function addUser(req, res) {}

function login(req, res) {
    const { username, password } = req.body;
}

function register(req, res) {}

export { getUsers, addUser, login, register };
