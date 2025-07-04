require('dotenv').config({ path: 'system.env' }); // ensure env variables are loaded

const config = {
    db: {
        host: process.env.DB_HOST || "localhost",  // use env or fallback
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "afrobuild_db",
        connectTimeout: 60000
    },
    listPerPage: 10,
};

module.exports = config;
