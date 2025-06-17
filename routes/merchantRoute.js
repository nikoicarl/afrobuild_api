const express = require('express');
const router = express.Router();
const merchants = require('../services/merchantHandler');

/* GET merchants. */
router.get('/', async function (req, res, next) {
    try {
        res.json(await merchants.getMultiple(req.query.page));
    } catch (err) {
        console.error(`Error while getting merchants `, err.message);
        next(err);
    }
});

module.exports = router;