const express = require("express");
const router = express.Router();
const { query } = require("../services/db");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

router.post("/", async (req, res) => {
    const accessToken = req.body?.access_token;

    if (!accessToken) {
        return res.status(400).json({
            type: "caution",
            message: "Access token is required.",
        });
    }

    try {
        // Fetch user info from Google
        const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!googleRes.ok) {
            const errorText = await googleRes.text();
            console.error("Google API error:", errorText);
            return res.status(401).json({
                type: "error",
                message: "Invalid or expired access token.",
            });
        }

        const profile = await googleRes.json();
        const email = profile?.email;

        if (!email) {
            return res.status(400).json({
                type: "caution",
                message: "Email not found in Google profile.",
            });
        }

        // Lookup user in the "user" table (singular)
        const sql = `SELECT * FROM user WHERE email = ? AND status IN (?, ?) LIMIT 1`;
        const users = await query(sql, [email, "active", "admin"]);

        if (!Array.isArray(users) || users.length === 0) {
            return res.status(404).json({
                type: "error",
                message: "No account found for this email.",
            });
        }

        const user = users[0];

        // Return user info for frontend to handle
        return res.status(200).json({
            type: "success",
            message: "Login successful.",
            user,
        });
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(500).json({
            type: "error",
            message: "Internal server error during authentication.",
        });
    }
});

module.exports = router;
