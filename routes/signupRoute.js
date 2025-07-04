const express = require("express");
const router = express.Router();
const md5 = require("md5");

const { query } = require("../services/db");
const GeneralFunction = require("../models/GeneralFunctionModel");
const gf = new GeneralFunction();

router.post("/", async (req, res) => {
    const {
        first_name,
        last_name,
        phone,
        email,
        address,
        username,
        password,
    } = req.body;

    // Validate required fields
    const checkEmpty = gf.ifEmpty([
        first_name,
        last_name,
        phone,
        email,
        username,
        password,
    ]);
    if (checkEmpty.includes("empty")) {
        return res
            .status(400)
            .json({ type: "caution", message: "All required fields must be filled" });
    }

    try {
        // Check if username or email already exists
        const existingUsers = await query(
            "SELECT * FROM user WHERE username = ? OR email = ?",
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                type: "caution",
                message: "Username or email already in use",
            });
        }

        // Generate unique numeric userid
        const userId = BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000));

        // Hash password
        const hashedPassword = md5(password);

        // Insert user, date_time uses MySQL NOW(), user_role and sessionid null
        const result = await query(
            `INSERT INTO user 
        (userid, first_name, last_name, phone, email, address, username, password, status, date_time, sessionid, user_role) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NULL, NULL)`,
            [
                userId.toString(),
                first_name,
                last_name,
                phone,
                email,
                address || null,
                username,
                hashedPassword,
                "active"
            ]
        );

        if (!result.affectedRows) {
            return res
                .status(500)
                .json({ type: "error", message: "Failed to create account" });
        }

        return res.status(201).json({
            type: "success",
            message: "Account created successfully",
            userId: userId.toString(),
        });
    } catch (err) {
        console.error("Signup error:", err);
        return res
            .status(500)
            .json({ type: "error", message: "Server error: " + err.message });
    }
});

module.exports = router;
