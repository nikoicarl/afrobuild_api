const express = require("express");
const router = express.Router();

const { query } = require("../services/db");
const GeneralFunction = require("../models/GeneralFunctionModel");
const gf = new GeneralFunction();

// Simple email validation function
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

router.post("/", async (req, res) => {
    const { userID, email, address } = req.body;

    // Validate userID presence
    if (gf.ifEmpty([userID]).includes("empty")) {
        return res.status(400).json({
            type: "caution",
            message: "User ID is required.",
        });
    }

    // Validate inputs
    if (email !== undefined && !validateEmail(email)) {
        return res.status(400).json({
            type: "caution",
            message: "Invalid email format.",
        });
    }

    if (email === undefined && address === undefined) {
        return res.status(400).json({
            type: "caution",
            message: "No fields to update.",
        });
    }

    try {
        // Check if user exists
        const [user] = await query("SELECT * FROM user WHERE userid = ? LIMIT 1", [userID]);

        if (!user) {
            return res.status(404).json({
                type: "error",
                message: "User not found.",
            });
        }

        // Build update query dynamically
        const updates = [];
        const params = [];

        if (email !== undefined) {
            updates.push("email = ?");
            params.push(email.trim());
        }
        if (address !== undefined) {
            updates.push("address = ?");
            params.push(address.trim());
        }

        params.push(userID); // for WHERE clause

        const sql = `UPDATE user SET ${updates.join(", ")} WHERE userid = ?`;

        const result = await query(sql, params);

        if (!result.affectedRows) {
            return res.status(500).json({
                type: "error",
                message: "Failed to update profile. Try again later.",
            });
        }

        return res.status(200).json({
            type: "success",
            message: "Profile updated successfully.",
        });
    } catch (err) {
        console.error("Update profile error:", err);
        return res.status(500).json({
            type: "error",
            message: "Server error. Try again later.",
        });
    }
});

module.exports = router;
