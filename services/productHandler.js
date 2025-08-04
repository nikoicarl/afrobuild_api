const db = require('./db');
const helper = require('../helper');
const config = require('../config');

async function getMultiple(page = 1) {
    const offset = helper.getOffset(page, config.listPerPage);
    const rows = await db.query(
        `SELECT 
        product.*, 
        CONCAT(user.first_name, ' ', user.last_name) AS supplier
    FROM product
    INNER JOIN user ON product.userid = user.userid
    WHERE product.status = ?
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