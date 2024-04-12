import connectToDB from "../config/db.js";

async function addToCart(req, res) {
    const pool = await connectToDB();

    try {
        let cartItem;
        let cartQuery = "";
        const { user_id, product_id, quantity, size_id, toppings } = req.body;

        await pool.beginTransaction();

        const [result] = await pool.query(
            "INSERT INTO CartItems (user_id, product_id, quantity, size_id) VALUES (?, ?, ?, ?)",
            [user_id, product_id, quantity, size_id || null]
        );

        if (toppings && toppings.length > 0) {
            for (const topping_id of toppings) {
                await pool.query(
                    "INSERT INTO ToppingStorages (topping_id, cart_item_id) VALUES (?, ?)",
                    [topping_id, result.insertId]
                );
            }
        }

        if (!size_id) {
            cartQuery = `SELECT
            ci.id,
            p.id AS product_id,
            p.name AS product_name,
            p.price AS product_price,
            p.image AS product_image,
            ci.quantity AS quantity
            FROM
                CartItems ci
            JOIN
                Products p ON ci.product_id = p.id
            WHERE
                ci.id = '${result.insertId}'
            GROUP BY
                ci.id, p.name, p.price, p.image, ci.quantity;`;
        } else {
            cartQuery = `SELECT
            ci.id,
            p.id AS product_id,
            p.name AS product_name,
            p.price AS product_price,
            p.image AS product_image,
            s.id AS size_id,
            s.size_name AS size_name,
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
                ci.id, p.name, p.price, p.image, s.id, s.size_name, ps.size_price, ci.quantity;`;
        }

        const [cart] = await pool.query(cartQuery);

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

        if (size_id || cartToppings.length > 0) {
            let total_topping_price = cartToppings.reduce(
                (acc, curr) => acc + parseFloat(curr.topping_price),
                0
            );

            cartItem = {
                ...cart[0],
                toppings: cartToppings.length > 0 ? cartToppings : [],
                total_item_price:
                    total_topping_price +
                    parseFloat(cart[0].product_price) +
                    parseFloat(cart[0].size_price) *
                        parseFloat(cart[0].quantity),
            };
        } else {
            cartItem = {
                ...cart[0],
                toppings: null,
                total_item_price:
                    parseFloat(cart[0].quantity) *
                    parseFloat(cart[0].product_price),
            };
        }

        await pool.commit();

        return res
            .status(200)
            .json({ status: 200, message: "success", data: cartItem });
    } catch (error) {
        await pool.rollback();

        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function getUserCart(req, res) {
    const pool = await connectToDB();

    try {
        const user_id = req.params.user_id;
        await pool.beginTransaction();

        const userCart = [];
        let cartItem;

        const [carts] = await pool.query(
            `SELECT
            ci.id,
            p.id AS product_id,
            p.name AS product_name,
            p.price AS product_price,
            p.image AS product_image,
            s.id AS size_id,
            s.size_name AS size_name,
            ps.size_price AS size_price,
            ci.quantity AS quantity
            FROM
                CartItems ci
            JOIN
                Products p ON ci.product_id = p.id
            LEFT JOIN
                ProductSizes ps ON ci.product_id = ps.product_id AND ci.size_id = ps.size_id
            LEFT JOIN
                Sizes s ON ci.size_id = s.id
            WHERE
                ci.user_id = '${user_id}'
            GROUP BY
                ci.id, p.name, p.price, p.image, s.id, s.size_name, ps.size_price, ci.quantity;`
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

            if (cart.size_id || cartToppings.length > 0) {
                let total_topping_price = cartToppings.reduce(
                    (acc, curr) => acc + parseFloat(curr.topping_price),
                    0
                );

                cartItem = {
                    ...cart,
                    toppings: cartToppings.length > 0 ? cartToppings : null,
                    total_item_price:
                        total_topping_price +
                        parseFloat(cart.product_price) +
                        parseFloat(cart.size_price) * parseFloat(cart.quantity),
                };
            } else {
                cartItem = {
                    ...cart,
                    toppings: null,
                    total_item_price:
                        parseFloat(cart.quantity) *
                        parseFloat(cart.product_price),
                };
            }

            userCart.push(cartItem);
        }
        await pool.commit();

        return res
            .status(200)
            .json({ status: 200, message: "success", data: userCart });
    } catch (error) {
        await pool.rollback();

        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
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
            [size_id || null, quantity, cart_item_id]
        );

        const [cartItemToppingCount] = await pool.query(
            `SELECT COUNT(*) AS 'count'
            FROM ToppingStorages 
            WHERE cart_item_id = '${cart_item_id}'
            `
        );

        const toppingCount = cartItemToppingCount[0].count;

        if (toppings) {
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
        }

        let cartQuery = "";

        if (!size_id) {
            cartQuery = `SELECT 
            ci.id,
            p.id AS product_id,
            p.name AS product_name,
            p.price AS product_price,
            p.image AS product_image,
            ci.quantity AS quantity
            FROM 
                CartItems ci
            JOIN 
                Products p ON ci.product_id = p.id
            WHERE
                ci.id = '${cart_item_id}'  
            GROUP BY
                ci.id, p.name, p.price, p.image, ci.quantity;`;
        } else {
            cartQuery = `SELECT 
            ci.id,
            p.id AS product_id,
            p.name AS product_name,
            p.price AS product_price,
            p.image AS product_image,
            s.id AS size_id,
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
                ci.id, p.name, p.price, p.image, s.id, s.size_name, ps.size_price, ci.quantity;`;
        }

        const [cart] = await pool.query(cartQuery);

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

        let cartItem;

        if (size_id || cartToppings.length > 0) {
            let total_topping_price = cartToppings.reduce(
                (acc, curr) => acc + parseFloat(curr.topping_price),
                0
            );

            cartItem = {
                ...cart[0],
                toppings: cartToppings.length > 0 ? cartToppings : [],
                total_item_price:
                    total_topping_price +
                    parseFloat(cart[0].product_price) +
                    parseFloat(cart[0].size_price) *
                        parseFloat(cart[0].quantity),
            };
        } else {
            cartItem = cart[0];
        }

        await pool.commit();

        return res
            .status(200)
            .json({ status: 200, message: "success", data: cartItem });
    } catch (error) {
        await pool.rollback();

        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
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

        return res.status(200).json({
            status: 200,
            message: "Delete cart item successfully",
        });
    } catch (error) {
        await pool.rollback();

        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

async function getTotalItemUserCart(req, res) {
    const pool = await connectToDB();

    try {
        const user_id = req.params.user_id;

        const [result] = await pool.query(
            `SELECT COUNT(*) AS 'count'
            FROM CartItems 
            WHERE user_id = '${user_id}'
            `
        );

        return res
            .status(200)
            .json({ status: 200, message: "success", data: result[0].count });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    } finally {
        if (pool) await pool.end();
    }
}

export { addToCart, editCart, getUserCart, deleteCart, getTotalItemUserCart };
