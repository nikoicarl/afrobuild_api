const express = require('express');
const router = express.Router();
const suppliers = require('../services/supplierHandler');

/* GET suppliers. */
router.get('/', async function (req, res, next) {
    try {
        res.json(await suppliers.getMultiple(req.query.page));
    } catch (err) {
        console.error(`Error while getting suppliers `, err.message);
        next(err);
    }
});

module.exports = router;