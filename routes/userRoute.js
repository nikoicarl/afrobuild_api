const express = require('express');
const router = express.Router();
const users = require('../services/userHandler');

/* GET multiple users. */
router.get('/', async function (req, res, next) {
    try {
        res.json(await users.getMultiple(req.query.page));
    } catch (err) {
        console.error(`Error while getting users `, err.message);
        next(err);
    }
});

/* GET single user by userid. */
router.get('/:userid', async function (req, res, next) {
    const userid = req.params.userid;
    try {
        const user = await users.getById(userid);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(`Error while getting user ${userid}`, err.message);
        next(err);
    }
});

module.exports = router;
