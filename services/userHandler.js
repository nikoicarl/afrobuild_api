const db = require('./db');
const helper = require('../helper');
const config = require('../config');

async function getMultiple(page = 1) {
    const offset = helper.getOffset(page, config.listPerPage);
    const rows = await db.query(
        `SELECT userid, first_name, last_name, phone, email, address, username, user_role, status, date_time
        FROM user LIMIT ${offset},${config.listPerPage}`
    );
    const data = helper.emptyOrRows(rows);
    const meta = { page };

    return {
        data,
        meta
    };
}

async function getById(userid) {
    const rows = await db.query(
        `SELECT userid, first_name, last_name, phone, email, address, username, user_role, status, date_time
        FROM user WHERE userid = ?`, [userid]
    );
    const data = helper.emptyOrRows(rows);
    return data.length > 0 ? data[0] : null;
}

module.exports = {
    getMultiple,
    getById
};
