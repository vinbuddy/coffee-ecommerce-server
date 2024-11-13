import connectToDB from "../config/db.js";
import bcrypt from "bcrypt";

import MemberRankModel from "../models/memberRank.model.js";
import MemberCoinModel from "../models/memberCoin.model.js";
import mongoose from "mongoose";
import MemberModel from "../models/member.model.js";

async function createUserAccount(req, res) {
    const { id, user_name, email, avatar, account_type } = req.body;

    let role_id = null;
    let isExisted = false;

    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });

    try {
        const [rows, fields] = await pool.execute(`SELECT * FROM Users WHERE id = '${id}'`);

        if (rows && rows.length) {
            isExisted = true;
            return res.status(200).json({
                status: 200,
                message: "Account is already existed",
            });
        }
    } catch (error) {
        console.log("error: ", error);
        return res.status(500).json({ status: 500, message: error.message });
    }

    try {
        // Not exist -> create user
        if (!isExisted) {
            // role query
            const [rows, fields] = await pool.execute("SELECT id FROM Roles WHERE role_name = 'user'");

            if (rows && rows.length > 0) {
                role_id = rows[0].id;
            }

            // Insert user
            const [result] = await pool.execute(
                "INSERT INTO Users (id, user_name, email, account_type, avatar, role_id) VALUES (?,?,?,?,?,?)",
                [id, user_name, email, account_type, avatar, role_id]
            );

            const [users] = await pool.query(`SELECT * FROM Users WHERE id = '${id}'`);

            // Create member rank and Coin
            const member = await MemberRankModel.findOne({ userId: new mongoose.Types.ObjectId(users[0].id) });
            if (!member) {
                await new MemberModel({
                    userId: new mongoose.Types.ObjectId(users[0].id),
                    username: user_name,
                    email: email,
                    avatar: avatar,
                });
                await new MemberRankModel({ userId: new mongoose.Types.ObjectId(users[0].id), vouchers: [] });
                await new MemberCoinModel({ userId: new mongoose.Types.ObjectId(users[0].id), history: [] });

                await MemberModel.save();
                await MemberRankModel.save();
                await MemberCoinModel.save();
            }

            return res.status(200).json({ status: 200, message: "success", data: users });
        }
    } catch (error) {
        console.log("error: ", error);
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function loginToStore(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });
    try {
        const { store_login_name, password } = req.body;

        const [store_accounts] = await pool.query(
            `SELECT s.*, StoreAccounts.store_login_name, StoreAccounts.password 
            FROM StoreAccounts 
            INNER JOIN Stores s ON s.id = store_id 
            WHERE store_login_name = '${store_login_name}'`
        );
        const originPassword = await bcrypt.compare(password.toString(), store_accounts[0].password);

        if (!store_accounts[0]) {
            return res.status(404).send("Account is not existed");
        }

        if (!originPassword) {
            return res.status(404).send({ status: 404, message: "Password is not valid" });
        }

        return res.status(200).json({ status: 200, message: "success", data: store_accounts[0] });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function createStoreAccount(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });

    try {
        const { store_id, password, store_login_name, account_type } = req.body;

        // Check if store_login_name and store_id is existed
        const [store_accounts] = await pool.query(
            `SELECT * FROM StoreAccounts WHERE store_login_name = '${store_login_name}'`
        );

        if (store_accounts && store_accounts.length) {
            return res.status(400).json({
                status: 400,
                message: "Store account is already existed",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHashed = await bcrypt.hash(password.toString(), salt);

        const [result] = await pool.query(
            "INSERT INTO StoreAccounts (store_id, password, store_login_name, account_type) VALUES (?, ?, ?, ?)",
            [store_id, passwordHashed, store_login_name, account_type]
        );

        // Get store account after created
        const [accounts] = await pool.query(
            `SELECT *
            FROM StoreAccounts 
            WHERE store_login_name = '${store_login_name}'`
        );

        return res.status(200).json({
            status: 200,
            message: "success",
            data: accounts[0],
        });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function loginToAdmin(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });
    try {
        const { email, password } = req.body;

        const [admin_accounts] = await pool.query(`SELECT * FROM Users WHERE email = '${email}' AND role_id = 2`);

        const originPassword = await bcrypt.compare(password.toString(), admin_accounts[0].password);

        if (!admin_accounts[0]) {
            return res.status(404).send("Account is not existed");
        }

        if (!originPassword) {
            return res.status(404).send({ status: 404, message: "Password is not valid" });
        }

        return res.status(200).json({ status: 200, message: "success", data: admin_accounts[0] });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function editStoreAccount(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });

    try {
        const { id, store_id, password, store_login_name, account_type } = req.body;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const passwordHashed = await bcrypt.hash(password.toString(), salt);

            await pool.query(
                `UPDATE StoreAccounts SET password = ?, store_login_name = ?, account_type = ?, store_id = ? WHERE id = ?`,
                [passwordHashed, store_login_name, account_type, store_id, id]
            );
        } else {
            await pool.query(
                `UPDATE StoreAccounts SET store_login_name = ?, account_type = ?, store_id = ? WHERE id = ?`,
                [store_login_name, account_type, store_id, id]
            );
        }

        const [accounts] = await pool.query(
            `SELECT *
            FROM StoreAccounts 
            WHERE id = ${id}`
        );

        return res.status(200).json({ status: 200, message: "success", data: accounts[0] });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function deleteStoreAccount(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });

    try {
        const { id } = req.params;

        await pool.query(`DELETE FROM StoreAccounts WHERE id = ${id}`);

        return res.status(200).json({ status: 200, message: "success" });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function getStoreAccounts(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });

    try {
        const [store_accounts] = await pool.query(`SELECT * FROM StoreAccounts`);

        return res.status(200).json({ status: 200, message: "success", data: store_accounts });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

export {
    createUserAccount,
    loginToStore,
    createStoreAccount,
    loginToAdmin,
    editStoreAccount,
    deleteStoreAccount,
    getStoreAccounts,
};
