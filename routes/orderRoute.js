require("dotenv").config({ path: './system.env' });

const express = require("express");
const router = express.Router();
const { query } = require("../services/db");
const GeneralFunction = require("../models/GeneralFunctionModel");
const gf = new GeneralFunction();

router.get("/", async (req, res) => {
    const { userID } = req.query;

    if (!userID) {
        return res.status(400).json({
            type: "caution",
            message: "User ID is required.",
        });
    }

    try {
        // Get all transactions for this user
        const transactions = await query(`
            SELECT 
                t.transactionid,
                t.amount,
                t.status,
                t.datetime
            FROM transaction t
            WHERE t.userid = ?
            ORDER BY t.datetime DESC
        `, [userID]);

        if (!transactions.length) {
            return res.status(200).json({
                type: "success",
                orders: [],
            });
        }

        // Get all items for all these transactions
        const transactionIds = transactions.map(t => t.transactionid);
        const placeholders = transactionIds.map(() => '?').join(',');
        const items = await query(`
            SELECT 
                transactionid,
                name,
                itemtype,
                category,
                price,
                quantity,
                subtotal
            FROM transaction_items
            WHERE transactionid IN (${placeholders})
        `, transactionIds);

        // Group items by transactionid
        const groupedItems = {};
        items.forEach(item => {
            if (!groupedItems[item.transactionid]) {
                groupedItems[item.transactionid] = [];
            }
            groupedItems[item.transactionid].push({
                name: item.name,
                type: item.itemtype,
                category: item.category,
                price: item.price,
                quantity: item.quantity,
                subtotal: item.subtotal
            });
        });

        // Attach items to each transaction
        const orders = transactions.map(tx => ({
            transactionid: tx.transactionid,
            amount: tx.amount,
            status: tx.status,
            datetime: tx.datetime,
            items: groupedItems[tx.transactionid] || []
        }));

        return res.status(200).json({
            type: "success",
            orders,
        });

    } catch (err) {
        console.error("Order fetch error:", err);
        return res.status(500).json({
            type: "error",
            message: "Server error. Could not load your orders.",
        });
    }
});

module.exports = router;
