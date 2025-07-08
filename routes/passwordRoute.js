const express = require("express");
const router = express.Router();
const { query } = require("../services/db");
const md5 = require("md5"); // Use md5 here
const nodemailer = require("nodemailer");
const baseUrl = process.env.APP_BASE_URL || 'http://localhost:7000';

// Nodemailer transporter config (unchanged)
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

router.post("/", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ type: "error", message: "Email is required" });
    }

    try {
        // Check if user exists
        const users = await query("SELECT * FROM user WHERE email = ?", [email]);
        if (!users.length) {
            return res
                .status(404)
                .json({ type: "error", message: "No account found with that email" });
        }

        const user = users[0];

        // Generate token using md5 by hashing unique string (email + timestamp + random number)
        const uniqueString = `${email}-${Date.now()}-${Math.random()}`;
        const token = md5(uniqueString);

        // Token expiration set to 1 hour from now
        const expires = new Date(Date.now() + 3600 * 1000);

        // Store token and expiry in DB
        await query(
            "UPDATE user SET reset_token = ?, reset_expires = ? WHERE userid = ?",
            [token, expires, user.userid]
        );

        // Build reset URL
        const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

        // Prepare email content (unchanged)
        const mailOptions = {
            from: `"AfroBuildList" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Password Reset Request",
            html: `
                <div style="font-family: 'Lato', 'Segoe UI', Tahoma, sans-serif; background-color: #f4f6f9; padding: 40px 0;">
                <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); overflow: hidden;">
                    
                    <div style="padding: 30px 40px; border-bottom: 1px solid #e0e0e0; text-align: center;">
                    <img src="https://afrobuildlist.com/assets/img/logo.png" alt="AfroBuildList Logo" style="max-height: 60px; margin-bottom: 10px;">
                    <h2 style="margin: 0; font-size: 22px; color: #222;">Password Reset Request</h2>
                    </div>

                    <div style="padding: 30px 40px; color: #444; line-height: 1.6;">
                    <p style="margin-top: 0;">Hi <strong>${user.first_name}</strong>,</p>

                    <p>You requested to reset your password. Please click the button below to set a new password. This link will expire in 1 hour.</p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}"
                        style="background-color: #09622e; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                        Reset Password
                        </a>
                    </div>

                    <p>If you didn’t request this reset, you can safely ignore this email. Your password will remain unchanged.</p>

                    <p style="margin-bottom: 0;">Thanks,<br>The AfroBuildList Team</p>
                    </div>

                    <div style="background-color: #f1f3f5; padding: 20px 40px; text-align: center; font-size: 12px; color: #777;">
                    &copy; ${new Date().getFullYear()} AfroBuildList. All rights reserved.<br>
                    <a href="https://afrobuildlist.com" style="color: #777; text-decoration: none;">Visit afrobuildlist.com</a>
                    </div>
                </div>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);

        return res.json({
            type: "success",
            message: "Password reset link sent to your email.",
        });
    } catch (err) {
        console.error("Forgot password error:", err);
        return res
            .status(500)
            .json({ type: "error", message: "Server error. Please try again later." });
    }
});

module.exports = router;
