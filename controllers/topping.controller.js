import connectToDB from "../config/db.js";

async function createTopping(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });

    try {
        const { topping_name, topping_price } = req.body;

        const [result] = await pool.query("INSERT INTO Toppings (topping_name, topping_price) VALUES (?, ?)", [
            topping_name,
            topping_price,
        ]);

        const [rows] = await pool.query(`SELECT * FROM Toppings WHERE id = '${result.insertId}'`);

        return res.status(200).json({ status: 200, message: "success", data: rows[0] });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function getToppings(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });
    try {
        const [rows, fields] = await pool.execute("SELECT * FROM Toppings is_deleted IS NULL OR is_deleted = 0");

        return res.status(200).json({ status: 200, message: "success", data: rows });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function deleteTopping(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });

    try {
        const topping_id = req.params.id;

        await pool.query(`UPDATE Toppings SET is_deleted = 1 WHERE id = '${topping_id}'`);

        await pool.commit();

        return res.status(200).json({ status: 200, message: "success" });
    } catch (error) {
        await pool.rollback();

        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function editTopping(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });

    try {
        const { topping_name, topping_price } = req.body;
        const topping_id = req.params.id;

        await pool.query("UPDATE Toppings SET topping_name = ?, topping_price = ? WHERE id = ?", [
            topping_name,
            topping_price,
            topping_id,
        ]);

        await pool.commit();

        return res.status(200).json({ status: 200, message: "success" });
    } catch (error) {
        await pool.rollback();

        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

export { createTopping, getToppings, editTopping, deleteTopping };
