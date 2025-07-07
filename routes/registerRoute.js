const express = require("express");
const router = express.Router();

const { query } = require("../services/db");
const GeneralFunction = require("../models/GeneralFunctionModel");
const gf = new GeneralFunction();

router.post("/", async (req, res) => {
    const {
        user_fullname,
        user_email,
        user_phone,
        service_name,
        service_price,
        category_id, // Array of selected categories
        service_description,
        register_category,
        service_or_product
    } = req.body;

    // Validate required fields
    const checkEmpty = gf.ifEmpty([
        user_fullname,
        user_email,
        service_name,
        service_price,
        category_id,
        register_category,
        service_or_product
    ]);

    if (checkEmpty.includes("empty")) {
        return res.status(400).json({
            type: "caution",
            message: "All required fields must be filled",
        });
    }

    try {
        const userId = gf.getTimeStamp();
        const nameParts = user_fullname.trim().split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || "";

        // Check if user already exists with same role
        const [existingUser] = await query(
            `SELECT * FROM user WHERE email = ? AND user_role = ? LIMIT 1`,
            [user_email, register_category]
        );

        let finalUserId = userId;

        if (!existingUser) {
            const insertUser = await query(
                `INSERT INTO user
                (userid, first_name, last_name, phone, email, username, password, user_role, status, date_time, sessionid)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NULL)`,
                [
                    userId,
                    firstName,
                    lastName,
                    user_phone || null,
                    user_email,
                    user_email,
                    gf.hashPassword('12345'),
                    register_category
                ]
            );

            if (!insertUser.affectedRows) {
                return res.status(500).json({
                    type: "error",
                    message: "Failed to register user.",
                });
            }
        } else {
            finalUserId = existingUser.userid;
        }

        // Check if entry already exists (per name & user & type)
        const checkTable = service_or_product === "product" ? "product" : "service";

        const [existing] = await query(
            `SELECT * FROM ${checkTable} WHERE userid = ? AND name = ? LIMIT 1`,
            [finalUserId, service_name]
        );

        if (existing) {
            return res.status(409).json({
                type: "warning",
                message: `This ${service_or_product} already exists.`,
            });
        }

        const entryId = gf.getTimeStamp();

        // Handle multi-category insert
        const categories = Array.isArray(category_id)
            ? category_id
            : [category_id];

        const insertPromises = categories.map(catId => {
            return query(
                `INSERT INTO ${checkTable} 
                (${checkTable}id, name, description, price, categoryid, userid, documents, datetime, status)
                VALUES (?, ?, ?, ?, ?, ?, NULL, NOW(), 'pending')`,
                [
                    entryId,
                    service_name,
                    service_description || null,
                    service_price,
                    catId,
                    finalUserId
                ]
            );
        });

        const results = await Promise.all(insertPromises);
        const allInserted = results.every(r => r.affectedRows > 0);

        if (!allInserted) {
            return res.status(500).json({
                type: "error",
                message: `Failed to create ${service_or_product}.`,
            });
        }

        return res.status(201).json({
            type: "success",
            message: `User and ${service_or_product}(s) registered successfully.`,
            userId: finalUserId.toString(),
        });
    } catch (err) {
        console.error("Registration error:", err);
        return res.status(500).json({
            type: "error",
            message: "Server error: " + err.message,
        });
    }
});

module.exports = router;
