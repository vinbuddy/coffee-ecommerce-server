import connectToDB from "../config/db.js";

async function createTopping(req, res) {
    const pool = await connectToDB();

    try {
        const { topping_name, topping_price } = req.body;

        const [result] = await pool.query(
            "INSERT INTO Toppings (topping_name, topping_price) VALUES (?, ?)",
            [topping_name, topping_price]
        );

        const [rows] = await pool.query(
            `SELECT * FROM Toppings WHERE id = '${result.insertId}'`
        );

        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows[0] });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        await pool.end();
    }
}

async function getToppings(req, res) {
    const pool = await connectToDB();
    try {
        const [rows, fields] = await pool.execute("SELECT * FROM Toppings");

        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        await pool.end();
    }
}

export { createTopping, getToppings };
