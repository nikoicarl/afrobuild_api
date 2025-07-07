const express = require("express");
const router = express.Router();

const { query } = require("../services/db");
const GeneralFunction = require("../models/GeneralFunctionModel");
const gf = new GeneralFunction();

router.post("/", async (req, res) => {
    const {
        merchant_name,
        merchant_email,
        merchant_phone,
        merchant_address,
        merchant_location,
        service_name,
        service_price,
        category_id,
        service_description,
    } = req.body;

    // Validate required fields
    const checkEmpty = gf.ifEmpty([
        merchant_name,
        merchant_email,
        service_name,
        service_price,
        category_id,
    ]);
    if (checkEmpty.includes("empty")) {
        return res.status(400).json({
            type: "caution",
            message: "All required fields must be filled",
        });
    }

    try {
        // 1. Get roleid for 'merchant'
        const [roleRow] = await query(
            `SELECT roleid FROM role WHERE name = 'merchant' AND status = 'active' LIMIT 1`
        );
        if (!roleRow) {
            return res.status(500).json({
                type: "error",
                message: "Merchant role not found.",
            });
        }

        const merchantRoleId = roleRow.roleid;

        // 2. Check if user already exists
        let [merchantUser] = await query(
            `SELECT * FROM users WHERE email = ? AND user_role = ? LIMIT 1`,
            [merchant_email, merchantRoleId]
        );

        let userId;

        if (merchantUser) {
            userId = merchantUser.userid;
        } else {
            // 3. Insert new merchant user
            userId = gf.getTimeStamp();
            const nameParts = merchant_name.trim().split(" ");
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(" ") || "";

            const insertUser = await query(
                `INSERT INTO users
                (userid, first_name, last_name, phone, email, address, username, password, user_role, status, date_time, sessionid)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NULL)`,
                [
                    userId,
                    firstName,
                    lastName,
                    merchant_phone || null,
                    merchant_email,
                    merchant_address || null,
                    merchant_email,
                    gf.hashPassword(merchant_email), // Replace with proper hash
                    merchantRoleId,
                ]
            );

            if (!insertUser.affectedRows) {
                return res.status(500).json({
                    type: "error",
                    message: "Failed to register merchant user.",
                });
            }
        }

        // 4. Check if service already exists for this user
        const [existingService] = await query(
            `SELECT * FROM service WHERE userid = ? AND name = ? LIMIT 1`,
            [userId, service_name]
        );

        if (existingService) {
            return res.status(409).json({
                type: "warning",
                message: "This service already exists for this merchant.",
            });
        }

        // 5. Insert the new service
        const serviceId = gf.getTimeStamp();
        const insertService = await query(
            `INSERT INTO service 
            (serviceid, name, description, price, categoryid, userid, documents, datetime, status)
            VALUES (?, ?, ?, ?, ?, ?, NULL, NOW(), 'active')`,
            [
                serviceId,
                service_name,
                service_description || null,
                service_price,
                category_id,
                userId
            ]
        );

        if (!insertService.affectedRows) {
            return res.status(500).json({
                type: "error",
                message: "Failed to create service.",
            });
        }

        return res.status(201).json({
            type: "success",
            message: "Merchant and service registered successfully.",
            userId: userId.toString(),
            serviceId: serviceId.toString(),
        });
    } catch (err) {
        console.error("Error during merchant/service registration:", err);
        return res.status(500).json({
            type: "error",
            message: "Server error: " + err.message,
        });
    }
});

module.exports = router;
