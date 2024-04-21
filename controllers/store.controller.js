import connectToDB from "../config/db.js";

async function createStore(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });

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
            image,
        } = req.body;

        const [result] = await pool.query(
            "INSERT INTO Stores (store_name, address, city, district, ward, google_map_location, open_time, close_time, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                store_name,
                address,
                city,
                district,
                ward,
                google_map_location,
                open_time,
                close_time,
                image,
            ]
        );

        const [rows] = await pool.query(
            `SELECT * FROM Stores WHERE id = '${result.insertId}'`
        );

        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows[0] });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function editStore(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });
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
            image,
        } = req.body;

        const [result] = await pool.query(
            "UPDATE Stores SET store_name = ?, address = ?, city = ?, district = ?, ward = ?, google_map_location = ?, open_time = ?, close_time = ?, image = ? WHERE id = ?",
            [
                store_name,
                address,
                city,
                district,
                ward,
                google_map_location,
                open_time,
                close_time,
                image,
                store_id,
            ]
        );

        const [rows] = await pool.query(
            `SELECT * FROM Stores WHERE id = '${store_id}'`
        );

        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows[0] });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function getStoreLocations(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });
    try {
        let sql =
            "SELECT city, COUNT(*) AS store_count FROM Stores GROUP BY city";
        const [rows, fields] = await pool.execute(sql);
        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function getStores(req, res) {
    const pool = await connectToDB();
    if (!pool)
        return res.status(500).json({
            status: 500,
            message: "Failed to connect to the database",
        });
    try {
        const city = req.query.city || "";

        let sql = "SELECT * FROM Stores";

        if (city.length > 0) {
            sql = `SELECT * FROM Stores WHERE city LIKE '%${city}%'`;
        }

        const [rows, fields] = await pool.execute(sql);
        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

export { createStore, getStores, editStore, getStoreLocations };
