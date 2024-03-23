import connectToDB from "../config/db.js";

async function createStore(req, res) {
    const pool = await connectToDB();

    try {
        const {
            store_name,
            address,
            city,
            district,
            ward,
            google_map_location,
            open_time,
            close_time,
        } = req.body;

        const [result] = await pool.query(
            "INSERT INTO Stores (store_name, address, city, district, ward, google_map_location, open_time, close_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
                store_name,
                address,
                city,
                district,
                ward,
                google_map_location,
                open_time,
                close_time,
            ]
        );

        const [rows] = await pool.query(
            `SELECT * FROM Stores WHERE id = '${result.insertId}'`
        );

        await pool.end();
        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows[0] });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
}

async function editStore(req, res) {
    const pool = await connectToDB();
    const store_id = req.params.id;

    try {
        const {
            store_name,
            address,
            city,
            district,
            ward,
            google_map_location,
            open_time,
            close_time,
        } = req.body;

        const [result] = await pool.query(
            "UPDATE Stores SET store_name = ?, address = ?, city = ?, district = ?, ward = ?, google_map_location = ?, open_time = ?, close_time = ? WHERE id = ?",
            [
                store_name,
                address,
                city,
                district,
                ward,
                google_map_location,
                open_time,
                close_time,
                store_id,
            ]
        );

        const [rows] = await pool.query(
            `SELECT * FROM Stores WHERE id = '${store_id}'`
        );

        await pool.end();
        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows[0] });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
}

async function getStores(req, res) {
    const pool = await connectToDB();
    try {
        const [rows, fields] = await pool.execute("SELECT * FROM Stores");
        await pool.end();
        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows });
    } catch (error) {
        await pool.end();

        return res.status(500).json({ status: 500, message: error.message });
    }
}

export { createStore, getStores, editStore };
