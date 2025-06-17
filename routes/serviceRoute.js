const express = require('express');
const router = express.Router();
const services = require('../services/serviceHandler');

/* GET services. */
router.get('/', async function (req, res, next) {
    try {
        res.json(await services.getMultiple(req.query.page));
    } catch (err) {
        console.error(`Error while getting services `, err.message);
        next(err);
    }
});

module.exports = router;