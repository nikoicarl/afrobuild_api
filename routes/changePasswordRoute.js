require("dotenv").config({ path: './system.env' });

const express = require("express");
const router = express.Router();
const md5 = require("md5");

const { query } = require("../services/db");
const GeneralFunction = require("../models/GeneralFunctionModel");
const gf = new GeneralFunction();

router.post("/", async (req, res) => {
    const { userID, currentPassword, newPassword } = req.body;

    // Validate input
    const checkEmpty = gf.ifEmpty([userID, currentPassword, newPassword]);
    if (checkEmpty.includes("empty")) {
        return res.status(400).json({
            type: "caution",
            message: "All fields are required.",
        });
    }

    try {
        // Fetch user by userID
        const [user] = await query("SELECT * FROM user WHERE userid = ? LIMIT 1", [userID]);

        if (!user) {
            return res.status(404).json({
                type: "error",
                message: "User not found.",
            });
        }

        // Check if current password matches (md5)
        if (user.password !== md5(currentPassword)) {
            return res.status(401).json({
                type: "error",
                message: "Current password is incorrect.",
            });
        }

        // Update with new md5 hashed password
        const hashedPassword = md5(newPassword);

        const update = await query(
            "UPDATE user SET password = ? WHERE userid = ?",
            [hashedPassword, userID]
        );

        if (!update.affectedRows) {
            return res.status(500).json({
                type: "error",
                message: "Failed to update password. Try again later.",
            });
        }

        return res.status(200).json({
            type: "success",
            message: "Password updated successfully.",
        });
    } catch (err) {
        console.error("Password change error:", err);
        return res.status(500).json({
            type: "error",
            message: "Server error. Try again later.",
        });
    }
});

module.exports = router;
