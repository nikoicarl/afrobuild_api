const express = require('express');
const router = express.Router();
const vendors = require('../services/vendorHandler');

/* GET vendors. */
router.get('/', async function (req, res, next) {
    try {
        res.json(await vendors.getMultiple(req.query.page));
    } catch (err) {
        console.error(`Error while getting vendors `, err.message);
        next(err);
    }
});

module.exports = router;