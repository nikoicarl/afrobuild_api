const mysql = require('mysql2/promise');
const config = require('../config');

const pool = mysql.createPool({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    waitForConnections: true,
    connectionLimit: 15,     // safe default, adjust if needed
    queueLimit: 0,
    connectTimeout: config.db.connectTimeout || 10000
});

async function query(sql, params) {
    const [results] = await pool.execute(sql, params);
    return results;
}

module.exports = {
    query
};
