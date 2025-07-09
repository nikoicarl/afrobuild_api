const express = require("express");
const router = express.Router();

const { query } = require("../services/db");
const GeneralFunction = require("../models/GeneralFunctionModel");
const gf = new GeneralFunction();

router.post("/", async (req, res) => {
    const { cart, user } = req.body;

    // Basic validation
    if (!user || !user.id || !cart || Object.keys(cart).length === 0) {
        return res.status(400).json({
            type: "caution",
            message: "User or cart data is missing or invalid.",
        });
    }

    const transactionId = gf.getTimeStamp();
    const now = new Date();

    // Calculate total amount
    const totalAmount = Object.values(cart).reduce((sum, item) => {
        const qty = item.quantity ?? 1;
        return sum + item.price * qty;
    }, 0);

    try {
        // Insert main transaction record
        const transactionResult = await query(
            `INSERT INTO transaction 
       (transactionid, userid, amount, message, datetime, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [transactionId, user.id, totalAmount, "Checkout initiated", now, "pending"]
        );

        if (!transactionResult.affectedRows) {
            return res.status(500).json({
                type: "error",
                message: "Failed to create transaction.",
            });
        }

        // Insert all cart items using a single batch query (optional optimization)
        const transactionItems = Object.values(cart).map((item) => [
            gf.getTimeStamp(),
            transactionId,
            item.serviceid || item.productid || item.id,
            item.item_type,
            item.category || null,
            item.name,
            item.price,
            item.quantity ?? 1,
            (item.price * (item.quantity ?? 1)),
        ]);

        // Insert each item, one by one, or replace with batch insert if supported
        for (const params of transactionItems) {
            const itemResult = await query(
                `INSERT INTO transaction_items 
         (transaction_itemsid, transactionid, product_service, itemtype, category, name, price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                params
            );

            if (!itemResult.affectedRows) {
                return res.status(500).json({
                    type: "error",
                    message: "Failed to add an item to the transaction.",
                });
            }
        }

        return res.status(201).json({
            type: "success",
            message: "Transaction successfully created.",
            transactionId,
        });
    } catch (error) {
        console.error("Transaction error:", error);
        return res.status(500).json({
            type: "error",
            message: "Server error: " + error.message,
        });
    }
});

module.exports = router;
