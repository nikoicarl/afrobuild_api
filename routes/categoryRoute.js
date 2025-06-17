const express = require('express');
const router = express.Router();
const categories = require('../services/categoryHandler');

/* GET categories. */
router.get('/', async function (req, res, next) {
    try {
        res.json(await categories.getMultiple(req.query.page));
    } catch (err) {
        console.error(`Error while getting categories `, err.message);
        next(err);
    }
});

module.exports = router;