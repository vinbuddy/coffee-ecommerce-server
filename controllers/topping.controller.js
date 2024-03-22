import connectToDB from "../config/db.js";

async function createTopping(req, res) {
    const pool = await connectToDB();

    try {
        const { topping_name, topping_price } = req.body;

        const [rows, field] = await pool.query(
            "INSERT INTO Toppings (topping_name, topping_name) VALUES (?, ?)",
            [topping_name, topping_price]
        );

        await pool.end();
        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows });
    } catch (error) {
        await pool.end();
        return res.status(500).json({ status: 500, message: error.message });
    }
}

async function getToppings(req, res) {
    const pool = await connectToDB();
    try {
        const [rows, fields] = await pool.execute("SELECT * FROM Toppings");
        await pool.end();
        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows });
    } catch (error) {
        await pool.end();

        return res.status(500).json({ status: 500, message: error.message });
    }
}

export { createTopping, getToppings };
