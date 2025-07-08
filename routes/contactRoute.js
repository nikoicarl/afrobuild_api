require('dotenv').config({ path: './system.env' });

const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

const GeneralFunction = require("../models/GeneralFunctionModel");
const gf = new GeneralFunction();

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
    const { name, email, message } = req.body;

    const checkEmpty = gf.ifEmpty([name, email, message]);
    if (checkEmpty.includes("empty")) {
        return res.status(400).json({
            type: "caution",
            message: "All fields are required.",
        });
    }

    const mailOptions = {
        from: `"AfroBuildList Contact" <${process.env.EMAIL_USER}>`,
        to: "cnikoi70@gmail.com", // or your designated contact email
        subject: `New Contact Message from ${name}`,
        html: `
        <div style="font-family: 'Segoe UI', Tahoma, sans-serif; background-color: #f4f6f9; padding: 40px 0;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); overflow: hidden;">
                <div style="padding: 30px 40px; border-bottom: 1px solid #e0e0e0; text-align: center;">
                    <img src="https://afrobuildlist.com/assets/img/logo.png" alt="AfroBuildList Logo" style="max-height: 60px; margin-bottom: 10px;">
                    <h2 style="margin: 0; font-size: 20px; color: #222;">New Contact Form Message</h2>
                </div>

                <div style="padding: 30px 40px; color: #444; line-height: 1.6;">
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Message:</strong></p>
                    <p style="background: #f8f9fc; padding: 15px 20px; border-radius: 8px; border: 1px solid #e1e4ea;">${message.replace(/\n/g, '<br>')}</p>
                </div>

                <div style="background-color: #f1f3f5; padding: 20px 40px; text-align: center; font-size: 12px; color: #777;">
                    &copy; ${new Date().getFullYear()} AfroBuildList. All rights reserved.<br>
                    <a href="https://afrobuildlist.com" style="color: #777; text-decoration: none;">Visit afrobuildlist.com</a>
                </div>
            </div>
        </div>
        `,
        replyTo: email
    };

    try {
        await transporter.sendMail(mailOptions);
        return res.json({
            success: true,
            message: "Message sent successfully.",
        });
    } catch (err) {
        console.error("Contact form email error:", err);
        return res.status(500).json({
            type: "error",
            message: "Failed to send message. Please try again later.",
        });
    }
});

module.exports = router;
