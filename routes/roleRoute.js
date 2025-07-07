const express = require('express');
const router = express.Router();
const roles = require('../services/roleHandler');

/* GET roles. */
router.get('/', async function (req, res, next) {
    try {
        res.json(await roles.getMultiple(req.query.page));
    } catch (err) {
        console.error(`Error while getting roles `, err.message);
        next(err);
    }
});

module.exports = router;