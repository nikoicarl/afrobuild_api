const db = require('./db');
const helper = require('../helper');
const config = require('../config');

async function getMultiple(page = 1) {
    const offset = helper.getOffset(page, config.listPerPage);
    const rows = await db.query(
        `SELECT 
        service.*, 
        CONCAT(user.first_name, ' ', user.last_name) AS supplier
    FROM service
    INNER JOIN user ON service.userid = user.userid
    WHERE service.status = ?
    LIMIT ?, ?`,
        ['active', offset, config.listPerPage]
    );

    const data = helper.emptyOrRows(rows);
    const meta = { page };

    return {
        data,
        meta
    }
}

module.exports = {
    getMultiple
}