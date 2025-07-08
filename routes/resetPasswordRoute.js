require("dotenv").config({ path: './system.env' });

const express = require("express");
const router = express.Router();
const md5 = require("md5");
const nodemailer = require("nodemailer");

const { query } = require("../services/db");
const GeneralFunction = require("../models/GeneralFunctionModel");
const gf = new GeneralFunction();

// Setup transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// === Route to handle password reset form submission ===
router.post("/", async (req, res) => {
    const { email, token, newPassword } = req.body;

    const checkEmpty = gf.ifEmpty([email, token, newPassword]);
    if (checkEmpty.includes("empty")) {
        return res.status(400).json({
            type: "caution",
            message: "All fields are required.",
        });
    }

    try {
        // Fetch user by email, including reset_token and reset_expires
        const [user] = await query("SELECT * FROM user WHERE email = ? LIMIT 1", [email]);

        if (!user) {
            return res.status(404).json({
                type: "error",
                message: "User not found.",
            });
        }

        // Check if token matches and is not expired
        if (user.reset_token !== token) {
            return res.status(401).json({
                type: "error",
                message: "Invalid reset token.",
            });
        }

        if (!user.reset_expires || new Date(user.reset_expires) < new Date()) {
            return res.status(401).json({
                type: "error",
                message: "Reset token has expired.",
            });
        }

        // Hash the new password with md5 (note: md5 is not recommended for passwords)
        const hashedPassword = md5(newPassword);

        // Update password and clear reset_token and reset_expires
        const update = await query(
            "UPDATE user SET password = ?, reset_token = NULL, reset_expires = NULL WHERE userid = ?",
            [hashedPassword, user.userid]
        );

        if (!update.affectedRows) {
            return res.status(500).json({
                type: "error",
                message: "Failed to update password. Try again later.",
            });
        }

        // Notify the user
        const mailOptions = {
            from: `"AfroBuildList" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Your Password Was Reset",
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, sans-serif; background-color: #f4f6f9; padding: 40px 0;">
                    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); overflow: hidden;">
                        <div style="padding: 30px 40px; border-bottom: 1px solid #e0e0e0; text-align: center;">
                            <img src="https://afrobuildlist.com/assets/img/logo.png" alt="AfroBuildList Logo" style="max-height: 60px; margin-bottom: 10px;">
                            <h2 style="margin: 0; font-size: 22px; color: #222;">Password Reset Confirmation</h2>
                        </div>

                        <div style="padding: 30px 40px; color: #444; line-height: 1.6;">
                            <p>Hi <strong>${user.first_name || "User"}</strong>,</p>
                            <p>Your password has been successfully reset. If you did not perform this action, please contact our support immediately.</p>
                            <div style="margin: 30px 0; text-align: center;">
                                <a href="https://afrobuildlist.com/login"
                                style="background-color: #09622e; color: #ffffff; padding: 12px 26px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px;">
                                Log In
                                </a>
                            </div>
                            <p>Stay safe,<br>The AfroBuildList Team</p>
                        </div>

                        <div style="background-color: #f1f3f5; padding: 20px 40px; text-align: center; font-size: 12px; color: #777;">
                            &copy; ${new Date().getFullYear()} AfroBuildList. All rights reserved.
                        </div>
                    </div>
                </div>
            `,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Email send failed:", error.message);
            } else {
                console.log("Reset confirmation email sent:", info.messageId);
            }
        });

        return res.status(200).json({
            type: "success",
            message: "Password reset successful. You can now log in.",
        });

    } catch (err) {
        console.error("Reset error:", err);
        return res.status(500).json({
            type: "error",
            message: "Server error. Try again later.",
        });
    }
});

module.exports = router;
