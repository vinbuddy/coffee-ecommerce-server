import pool from "../config/db.js";

function getUsers(req, res) {
    pool.connect();

    pool.query("SELECT * FROM Users", (err, result, fields) => {
        if (err) {
            return res.status(500).json({ status: 500, message: err.message });
        }

        return res
            .status(200)
            .json({ status: 200, message: "success", data: result });
    });

    pool.end();
}

function addUser(req, res) {}

function login(req, res) {
    const { username, password } = req.body;
}

function register(req, res) {}

export { getUsers, addUser, login, register };
