require('dotenv').config({ path: './system.env' });

const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const md5 = require("md5");

const { query } = require("../services/db");
const GeneralFunction = require("../models/GeneralFunctionModel");
const gf = new GeneralFunction();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: true, // Use SSL
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

router.post("/", async (req, res) => {
    const {
        user_fullname,
        user_email,
        user_phone,
        service_name,
        service_price,
        category_id,
        service_description,
        register_category,
        service_or_product,
    } = req.body;

    const checkEmpty = gf.ifEmpty([
        user_fullname,
        user_email,
        service_name,
        service_price,
        category_id,
        register_category,
        service_or_product,
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
        const defaultPassword = gf.generateRandomPassword(10);

        if (!existingUser) {
            // Insert user with md5 hashed random password
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
                    md5(defaultPassword),
                    register_category,
                ]
            );

            if (!insertUser.affectedRows) {
                return res.status(500).json({
                    type: "error",
                    message: "Failed to register user.",
                });
            }

            // Send email with credentials
            const mailOptions = {
                from: `"AfroBuildList" <${process.env.EMAIL_USER}>`,
                to: user_email,
                subject: "Welcome to AfroBuildList – Your Account Credentials",
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; background-color: #f4f6f9; padding: 40px 0;">
                        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); overflow: hidden;">
                            <div style="padding: 30px 40px; border-bottom: 1px solid #e0e0e0; text-align: center;">
                                <img src="https://afrobuildlist.com/assets/img/logo.png" alt="AfroBuildList Logo" style="max-height: 60px; margin-bottom: 10px;">
                                <h2 style="margin: 0; font-size: 22px; color: #222;">Welcome to AfroBuildList</h2>
                            </div>

                            <div style="padding: 30px 40px; color: #444; line-height: 1.6;">
                                <p style="margin-top: 0;">Hi <strong>${firstName}</strong>,</p>

                                <p>Thank you for registering on <strong>AfroBuildList</strong>. Below are your login details:</p>

                                <div style="background-color: #f8f9fc; border: 1px solid #e1e4ea; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
                                    <p style="margin: 0; font-size: 15px;"><strong>Username:</strong> ${user_email}</p>
                                    <p style="margin: 8px 0 0; font-size: 15px;"><strong>Password:</strong> ${defaultPassword}</p>
                                </div>

                                <p style="color: #c0392b; font-weight: bold;">Please log in and change your password immediately.</p>

                                <div style="margin: 30px 0; text-align: center;">
                                    <a href="https://afrobuildlist.com/login"
                                    style="background-color: #09622e; color: #ffffff; padding: 12px 26px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px;">
                                    Log In Now
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
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Email send failed:", error.response || error.message || error);
                } else {
                    console.log("✅ Email sent:", info.response);
                    console.log("📨 Message ID:", info.messageId);
                }
            });

        } else {
            finalUserId = existingUser.userid;
        }

        // Determine table for product or service
        const checkTable = service_or_product === "product" ? "product" : "service";

        // Check if the service or product already exists for user
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

        const categories = Array.isArray(category_id) ? category_id : [category_id];

        // Insert entries for all categories selected
        const insertPromises = categories.map((catId) =>
            query(
                `INSERT INTO ${checkTable} 
          (${checkTable}id, name, description, price, categoryid, userid, documents, datetime, status)
          VALUES (?, ?, ?, ?, ?, ?, NULL, NOW(), 'active')`,
                [entryId, service_name, service_description || null, service_price, catId, finalUserId]
            )
        );

        const results = await Promise.all(insertPromises);
        const allInserted = results.every((r) => r.affectedRows > 0);

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
