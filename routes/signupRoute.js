require('dotenv').config({ path: './system.env' });

const express = require("express");
const router = express.Router();
const md5 = require("md5");
const nodemailer = require("nodemailer");

const { query } = require("../services/db");
const GeneralFunction = require("../models/GeneralFunctionModel");
const gf = new GeneralFunction();

// Simple phone validation helper (adjust regex if needed)
function isValidPhone(phone) {
    const phoneRegex = /^[+\d]?(?:[\d\s()-]{7,})$/;
    return phoneRegex.test(phone);
}

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_PORT == "465", // true for port 465, false otherwise
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

router.post("/", async (req, res) => {
    const {
        first_name,
        last_name,
        phone,
        email,
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

    // Validate phone format
    if (!isValidPhone(phone)) {
        return res.status(400).json({ type: "caution", message: "Invalid phone number format" });
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

        // Get the roleid for 'customer' from role table
        const roleResult = await query(
            "SELECT roleid FROM role WHERE name = ? LIMIT 1",
            ["customer"]
        );
        if (roleResult.length === 0) {
            return res.status(500).json({ type: "error", message: "Role 'customer' not found" });
        }
        const customerRoleId = roleResult[0].roleid;

        // Generate unique numeric userid
        const userId = gf.getTimeStamp();

        // Hash password
        const hashedPassword = md5(password);

        // Insert user, date_time uses MySQL NOW(), user_role numeric 0, sessionid null
        const result = await query(
            `INSERT INTO user 
            (userid, first_name, last_name, phone, email, username, password, status, date_time, sessionid, user_role) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NULL, ?)`,
            [
                userId.toString(),
                first_name,
                last_name,
                phone,
                email,
                username,
                hashedPassword,
                "active",
                customerRoleId, // numeric user_role
            ]
        );

        if (!result.affectedRows) {
            return res
                .status(500)
                .json({ type: "error", message: "Failed to create account" });
        }

        // Prepare email content with styled HTML
        const mailOptions = {
            from: `"AfroBuildList" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Welcome to AfroBuildList – Your Account Credentials",
            html: `
                <div style="font-family: 'Lato', 'Segoe UI', Tahoma, sans-serif; background-color: #f4f6f9; padding: 40px 0;">
                    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); overflow: hidden;">
                        
                        <div style="padding: 30px 40px; border-bottom: 1px solid #e0e0e0; text-align: center;">
                            <img src="https://afrobuildlist.com/assets/img/logo.png" alt="AfroBuildList Logo" style="max-height: 60px; margin-bottom: 10px;">
                            <h2 style="margin: 0; font-size: 22px; color: #222;">Welcome to AfroBuildList</h2>
                        </div>

                        <div style="padding: 30px 40px; color: #444; line-height: 1.6;">
                            <p style="margin-top: 0;">Hi <strong>${first_name}</strong>,</p>

                            <p>Thank you for signing up on <strong>AfroBuildList</strong>. Here are your account details:</p>

                            <table style="width: 100%; border-collapse: collapse; margin: 24px 0; background-color: #f8f9fc; border: 1px solid #e1e4ea; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 12px 20px; font-weight: bold; border-bottom: 1px solid #e1e4ea;">Username</td>
                                    <td style="padding: 12px 20px; border-bottom: 1px solid #e1e4ea;">${username}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 20px; font-weight: bold;">Password</td>
                                    <td style="padding: 12px 20px;">${password}</td>
                                </tr>
                            </table>

                            <div style="margin: 30px 0; text-align: center;">
                                <a href="https://afrobuildlist.com/login"
                                style="background-color: #09622e; color: #ffffff; padding: 12px 26px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px;">
                                Access Your Account
                                </a>
                            </div>

                            <p>If you have any questions or need assistance, feel free to reply to this email.</p>

                            <p style="margin-bottom: 0;">Best regards,<br>The AfroBuildList Team</p>
                        </div>

                        <div style="background-color: #f1f3f5; padding: 20px 40px; text-align: center; font-size: 12px; color: #777;">
                            &copy; ${new Date().getFullYear()} AfroBuildList. All rights reserved.<br>
                            <a href="https://afrobuildlist.com" style="color: #777; text-decoration: none;">Visit afrobuildlist.com</a>
                        </div>
                    </div>
                </div>
            `,
        };

        // Send email
        await transporter.sendMail(mailOptions);

        return res.status(201).json({
            type: "success",
            message: "Account created successfully. Credentials sent via email.",
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
