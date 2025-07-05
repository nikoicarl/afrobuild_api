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
        // ✅ Check if merchant with the same name already exists
        const [existingMerchant] = await query(
            `SELECT * FROM merchant WHERE name = ?`,
            [merchant_name]
        );

        if (existingMerchant) {
            return res.status(409).json({
                type: "warning",
                message: "Merchant with this name already exists",
            });
        }

        // Generate unique merchant ID
        const merchantId = gf.getTimeStamp();

        // ✅ Check if service name already exists for the merchant name
        const [serviceCheck] = await query(
            `SELECT s.* FROM service s
                JOIN merchant m ON s.merchantid = m.merchantid
                WHERE m.name = ? AND s.name = ?`,
            [merchant_name, service_name]
        );

        if (serviceCheck) {
            return res.status(409).json({
                type: "warning",
                message: "Service with this name already exists for this merchant",
            });
        }

        // Insert merchant
        const merchantResult = await query(
            `INSERT INTO merchant 
            (merchantid, name, phone, email, address, location, status, date_time, sessionid)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW(), NULL)`,
            [
                merchantId.toString(),
                merchant_name,
                merchant_phone || null,
                merchant_email || null,
                merchant_address || null,
                merchant_location || null,
            ]
        );

        if (!merchantResult.affectedRows) {
            return res
                .status(500)
                .json({ type: "error", message: "Failed to create merchant" });
        }

        // Insert service with the new merchantid
        const serviceId = gf.getTimeStamp();

        const serviceResult = await query(
            `INSERT INTO service 
            (serviceid, name, description, price, categoryid, merchantid, documents, datetime, status)
            VALUES (?, ?, ?, ?, ?, ?, NULL, NOW(), 'active')`,
            [
                serviceId.toString(),
                service_name,
                service_description || null,
                service_price,
                category_id,
                merchantId.toString(),
            ]
        );

        if (!serviceResult.affectedRows) {
            return res
                .status(500)
                .json({ type: "error", message: "Failed to create service" });
        }

        return res.status(201).json({
            type: "success",
            message: "Merchant and service registered successfully",
            merchantId: merchantId.toString(),
            serviceId: serviceId.toString(),
        });
    } catch (err) {
        console.error("Register error:", err);
        return res
            .status(500)
            .json({ type: "error", message: "Server error: " + err.message });
    }
});

module.exports = router;
