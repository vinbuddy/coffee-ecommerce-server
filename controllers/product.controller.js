import connectToDB from "../config/db.js";

async function getProducts(req, res) {
    const pool = await connectToDB();
    try {
        const searchName = req.params.name || "";
        const category_id = req.params.category_id || 0;

        // Get all product
        if (category_id === 0) {
            const [rows, fields] = await pool.execute(
                `SELECT Products.*, Categories.category_name FROM Products JOIN Categories ON Products.category_id = Categories.id WHERE name LIKE '%${searchName}%'`
            );

            await pool.end();
            return res
                .status(200)
                .json({ status: 200, message: "success", data: rows });
        } else {
            const [rows, fields] = await pool.execute(
                `SELECT Products.*, Categories.category_name FROM Products JOIN Categories ON Products.category_id = Categories.id WHERE Categories.id = '${category_id}' AND name LIKE '%${searchName}%'`
            );

            await pool.end();
            return res
                .status(200)
                .json({ status: 200, message: "success", data: rows });
        }
    } catch (error) {
        await pool.end();

        return res.status(500).json({ status: 500, message: error.message });
    }
}

async function getProduct(req, res) {
    const pool = await connectToDB();
    try {
        const product_id = req.params.id;
        const [rows, fields] = await pool.execute(
            `SELECT Products.*, Categories.category_name FROM Products JOIN Categories ON Products.category_id = Categories.id WHERE Products.id = '${product_id}'`
        );
        await pool.end();
        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows[0] });
    } catch (error) {
        await pool.end();

        return res.status(500).json({ status: 500, message: error.message });
    }
}

async function createProduct(req, res) {
    const pool = await connectToDB();
    try {
        const {
            name,
            price,
            status,
            description,
            image,
            category_id,
            product_toppings,
            product_sizes,
        } = req.body;

        const sql = `INSERT INTO Products (name, price, status, description, image, category_id) VALUES (?, ?, ?, ?, ?, ?)`;
        const values = [name, price, status, description, image, category_id];

        await pool.beginTransaction();

        const [productResult] = await pool.execute(sql, values);

        const productId = productResult.insertId;

        if (product_toppings && product_toppings.length > 0) {
            for (const topping of product_toppings) {
                await pool.execute(
                    "INSERT INTO ProductToppings (product_id, topping_id) VALUES (?, ?)",
                    [productId, topping.topping_id]
                );
            }
        }

        if (product_sizes && product_sizes.length > 0) {
            for (const size of product_sizes) {
                await pool.execute(
                    "INSERT INTO ProductSizes (product_id, size_id, size_price) VALUES (?, ?, ?)",
                    [productId, size.size_id, size.size_price]
                );
            }
        }
        const [rows, fields] = await pool.execute(
            `SELECT Products.*, Categories.category_name FROM Products JOIN Categories ON Products.category_id = Categories.id WHERE Products.id = '${productId}'`
        );
        await pool.commit();

        await pool.end();
        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows[0] });
    } catch (error) {
        await pool.rollback();
        await pool.end();

        return res.status(500).json({ status: 500, message: error.message });
    }
}

async function editProduct(req, res) {
    const pool = await connectToDB();
    try {
        const product_id = req.params.id;
        const {
            name,
            price,
            status,
            description,
            image,
            category_id,
            product_toppings,
            product_sizes,
        } = req.body;

        await pool.beginTransaction();

        // Update product table
        const sql = `UPDATE Products SET name = ?, price = ?, status = ?, description = ?, image = ?, category_id = ? WHERE id = ?`;
        const values = [
            name,
            price,
            status,
            description,
            image,
            category_id,
            product_id,
        ];
        await pool.query(sql, values);

        // Get size - topping count
        const [size_topping_count] = await pool.query(
            `SELECT 'toppingCount' AS source, COUNT(*) AS 'count'
            FROM ProductToppings 
            WHERE product_id = '${product_id}'
            UNION ALL
            SELECT 'sizeCount' AS source, COUNT(*) AS 'count'
            FROM ProductSizes 
            WHERE product_id = '${product_id}'`
        );

        const toppingCount = size_topping_count[0].count;
        const sizeCount = size_topping_count[1].count;

        if (product_toppings.length < toppingCount) {
            // Delete
            const toppingKept = product_toppings.map(
                (product_topping) => product_topping.topping_id
            );

            await pool.query(
                "DELETE FROM ProductToppings WHERE product_id = ? AND topping_id NOT IN (?)",
                [product_id, toppingKept]
            );
        } else {
            // Add new toppings

            const [rows] = await pool.query(
                `SELECT topping_id FROM ProductToppings WHERE product_id = '${product_id}'`
            );

            const existingToppings = rows.map((row) => row.topping_id);

            const newToppings = product_toppings.filter(
                (product_topping) =>
                    !existingToppings.includes(product_topping.topping_id)
            );

            for (const topping of newToppings) {
                await pool.execute(
                    "INSERT INTO ProductToppings (product_id, topping_id) VALUES (?, ?)",
                    [product_id, topping.topping_id]
                );
            }
        }

        if (product_sizes.length < sizeCount) {
            // Delete size
            const sizeKept = product_sizes.map(
                (product_size) => product_size.size_id
            );

            await pool.query(
                "DELETE FROM ProductSizes WHERE product_id = ? AND size_id NOT IN (?)",
                [product_id, sizeKept]
            );
        } else {
            for (const size of product_sizes) {
                if (size?.id) {
                    await pool.query(
                        "UPDATE ProductSizes SET size_price = ? WHERE id = ?",
                        [size.size_price, size.id]
                    );
                } else {
                    await pool.query(
                        `INSERT INTO ProductSizes (product_id, size_id, size_price)
                        SELECT ?, ?, ?
                        FROM dual
                        WHERE NOT EXISTS (
                            SELECT 1
                            FROM ProductSizes
                            WHERE (product_id, size_id) IN (
                                (SELECT product_id, size_id FROM ProductSizes WHERE product_id != ? OR size_id != ?)
                            )
                        )`,
                        [
                            product_id,
                            size.size_id,
                            size.size_price,
                            product_id,
                            size.size_id,
                        ]
                    );
                }
            }
        }

        const [rows, fields] = await pool.query(
            `SELECT Products.*, Categories.category_name FROM Products JOIN Categories ON Products.category_id = Categories.id WHERE Products.id = '${product_id}'`
        );

        await pool.commit();
        await pool.end();

        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows[0] });
    } catch (error) {
        await pool.rollback();
        await pool.end();

        return res.status(500).json({ status: 500, message: error.message });
    }
}

async function deleteProduct(req, res) {
    const pool = await connectToDB();

    try {
        await pool.beginTransaction();
        const product_id = req.params.id;

        const [result] = await pool.query(
            `DELETE FROM Products WHERE id = '${product_id}'`
        );

        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ status: 400, error: "Product not found" });
        }

        await pool.query(
            `DELETE FROM ProductToppings WHERE product_id = '${product_id}'`
        );

        // Xóa bản ghi trong ProductSizes
        await pool.query(
            `DELETE FROM ProductSizes WHERE product_id = '${product_id}'`
        );

        await pool.commit();

        return res.status(200).json({
            status: 200,
            message: "Product deleted successfully",
        });
    } catch (error) {
        await pool.rollback();
        await pool.end();

        return res.status(500).json({ status: 500, message: error.message });
    }
}

async function getProductSizes(req, res) {
    const pool = await connectToDB();
    const product_id = req.params.id;

    try {
        const [rows, field] = await pool.query(
            "SELECT ProductSizes.*, Sizes.size_name FROM ProductSizes INNER JOIN Sizes ON Sizes.id = ProductSizes.size_id WHERE ProductSizes.product_id = ?",
            [product_id]
        );

        await pool.end();
        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
}

async function getProductToppings(req, res) {
    const pool = await connectToDB();
    const product_id = req.params.id;

    try {
        const [rows, field] = await pool.query(
            "SELECT ProductToppings.product_id, Toppings.* FROM ProductToppings INNER JOIN Toppings ON Toppings.id = ProductToppings.topping_id WHERE ProductToppings.product_id = ?",
            [product_id]
        );

        await pool.end();
        return res
            .status(200)
            .json({ status: 200, message: "success", data: rows });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
}

export {
    getProducts,
    getProduct,
    editProduct,
    deleteProduct,
    createProduct,
    getProductSizes,
    getProductToppings,
};
