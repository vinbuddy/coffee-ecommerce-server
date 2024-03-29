import connectToDB from "../config/db.js";

async function addToCart(req, res) {
    const pool = await connectToDB();

    try {
        const { user_id, product_id, quantity, size_id, toppings } = req.body;

        await pool.beginTransaction();

        const [result] = await pool.query(
            "INSERT INTO CartItems (user_id, product_id, quantity, size_id) VALUES (?, ?, ?, ?)",
            [user_id, product_id, quantity, size_id]
        );

        if (toppings && toppings.length > 0) {
            for (const topping_id of toppings) {
                await pool.query(
                    "INSERT INTO ToppingStorages (topping_id, cart_item_id) VALUES (?, ?)",
                    [topping_id, result.insertId]
                );
            }
        }

        const [cart] = await pool.query(
            `SELECT 
            ci.id,
            p.id AS product_id,
            p.name AS product_name,
            p.price AS product_price,
            p.image AS product_image,
            s.size_name AS size,
            ps.size_price AS size_price,
            ci.quantity AS quantity
            FROM 
                CartItems ci
            JOIN 
                Products p ON ci.product_id = p.id
            JOIN 
                ProductSizes ps ON ci.product_id = ps.product_id AND ci.size_id = ps.size_id
            JOIN 
                Sizes s ON ci.size_id = s.id
            WHERE
                ci.id = '${result.insertId}'  
            GROUP BY
                ci.id, p.name, p.price, p.image, s.size_name, ps.size_price, ci.quantity;`
        );

        const [cartToppings] = await pool.query(
            `SELECT
            ts.id AS topping_storage_id,
            t.topping_name,
            t.topping_price
            FROM
                ToppingStorages ts
            JOIN
                Toppings t ON ts.topping_id = t.id
            WHERE
                ts.cart_item_id = '${result.insertId}' `
        );

        const cartItem = {
            ...cart[0],
            toppings: cartToppings,
            total_item_price:
                (cartToppings.reduce(
                    (acc, curr) => acc + parseFloat(curr.topping_price),
                    0
                ) +
                    parseFloat(cart[0].product_price) +
                    parseFloat(cart[0].size_price)) *
                parseFloat(cart[0].quantity),
        };

        await pool.commit();
        await pool.end();

        return res
            .status(200)
            .json({ status: 200, message: "success", data: cartItem });
    } catch (error) {
        await pool.rollback();
        await pool.commit();

        return res.status(500).json({ status: 500, message: error.message });
    }
}

async function getUserCart(req, res) {
    const pool = await connectToDB();

    try {
        const user_id = req.params.user_id;
        await pool.beginTransaction();

        const userCart = [];

        const [carts] = await pool.query(
            `SELECT 
            ci.id,
            p.id AS product_id,
            p.name AS product_name,
            p.price AS product_price,
            p.image AS product_image,
            s.size_name AS size,
            ps.size_price AS size_price,
            ci.quantity AS quantity
            FROM 
                CartItems ci
            JOIN 
                Products p ON ci.product_id = p.id
            JOIN 
                ProductSizes ps ON ci.product_id = ps.product_id AND ci.size_id = ps.size_id
            JOIN 
                Sizes s ON ci.size_id = s.id
            WHERE
                ci.user_id = '${user_id}'  
            GROUP BY
                ci.id, p.name, p.price, p.image, s.size_name, ps.size_price, ci.quantity;`
        );

        for (const cart of carts) {
            const [cartToppings] = await pool.query(
                `SELECT
                ts.id AS topping_storage_id,
                t.topping_name,
                t.topping_price
                FROM
                    ToppingStorages ts
                JOIN
                    Toppings t ON ts.topping_id = t.id
                WHERE
                    ts.cart_item_id = '${cart.id}' `
            );

            userCart.push({
                ...cart,
                toppings: cartToppings,
                total_item_price:
                    (cartToppings.reduce(
                        (acc, curr) => acc + parseFloat(curr.topping_price),
                        0
                    ) +
                        parseFloat(cart.product_price) +
                        parseFloat(cart.size_price)) *
                    parseFloat(cart.quantity),
            });
        }

        await pool.commit();
        await pool.end();

        return res
            .status(200)
            .json({ status: 200, message: "success", data: userCart });
    } catch (error) {
        await pool.rollback();
        await pool.commit();

        return res.status(500).json({ status: 500, message: error.message });
    }
}

async function editCart(req, res) {
    const pool = await connectToDB();

    try {
        const cart_item_id = req.params.id;
        const { quantity, size_id, toppings } = req.body;
        await pool.beginTransaction();

        await pool.query(
            "UPDATE CartItems SET size_id = ?, quantity = ? WHERE id = ?",
            [size_id, quantity, cart_item_id]
        );

        const [cartItemToppingCount] = await pool.query(
            `SELECT COUNT(*) AS 'count'
            FROM ToppingStorages 
            WHERE cart_item_id = '${cart_item_id}'
            `
        );

        const toppingCount = cartItemToppingCount[0].count;

        if (toppings.length < toppingCount) {
            await pool.query(
                "DELETE FROM ToppingStorages WHERE cart_item_id = ? AND topping_id NOT IN (?)",
                [cart_item_id, toppings]
            );
        } else {
            const [rows] = await pool.query(
                `SELECT topping_id FROM ToppingStorages WHERE cart_item_id = '${cart_item_id}'`
            );

            const existingToppings = rows.map((row) => row.topping_id);

            const newToppings = toppings.filter(
                (topping) => !existingToppings.includes(topping)
            );

            for (const topping of newToppings) {
                await pool.query(
                    "INSERT INTO ToppingStorages (cart_item_id, topping_id) VALUES (?, ?)",
                    [cart_item_id, topping]
                );
            }
        }

        const [cart] = await pool.query(
            `SELECT 
            ci.id,
            p.id AS product_id,
            p.name AS product_name,
            p.price AS product_price,
            p.image AS product_image,
            s.size_name AS size,
            ps.size_price AS size_price,
            ci.quantity AS quantity
            FROM 
                CartItems ci
            JOIN 
                Products p ON ci.product_id = p.id
            JOIN 
                ProductSizes ps ON ci.product_id = ps.product_id AND ci.size_id = ps.size_id
            JOIN 
                Sizes s ON ci.size_id = s.id
            WHERE
                ci.id = '${cart_item_id}'  
            GROUP BY
                ci.id, p.name, p.price, p.image, s.size_name, ps.size_price, ci.quantity;`
        );

        const [cartToppings] = await pool.query(
            `SELECT
            ts.id AS topping_storage_id,
            t.topping_name,
            t.topping_price
            FROM
                ToppingStorages ts
            JOIN
                Toppings t ON ts.topping_id = t.id
            WHERE
                ts.cart_item_id = '${cart_item_id}' `
        );

        const cartItem = {
            ...cart[0],
            toppings: cartToppings,
            total_item_price:
                (cartToppings.reduce(
                    (acc, curr) => acc + parseFloat(curr.topping_price),
                    0
                ) +
                    parseFloat(cart[0].product_price) +
                    parseFloat(cart[0].size_price)) *
                parseFloat(cart[0].quantity),
        };

        await pool.commit();
        await pool.end();

        return res
            .status(200)
            .json({ status: 200, message: "success", data: cartItem });
    } catch (error) {
        await pool.rollback();
        await pool.commit();

        return res.status(500).json({ status: 500, message: error.message });
    }
}

async function deleteCart(req, res) {
    const pool = await connectToDB();

    try {
        await pool.beginTransaction();

        const cart_item_id = req.params.id;

        await pool.query(
            `DELETE FROM ToppingStorages WHERE cart_item_id = '${cart_item_id}'`
        );

        const [result] = await pool.query(
            `DELETE FROM CartItems WHERE id = '${cart_item_id}'`
        );

        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ status: 400, message: "cart item not found" });
        }

        await pool.commit();
        await pool.end();

        return res.status(200).json({
            status: 200,
            message: "Delete cart item successfully",
        });
    } catch (error) {
        await pool.rollback();
        await pool.commit();

        return res.status(500).json({ status: 500, message: error.message });
    }
}

export { addToCart, editCart, getUserCart, deleteCart };
