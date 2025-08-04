const db = require('./db');
const helper = require('../helper');
const config = require('../config');

function generatePlaceholders(arr) {
    return arr.map(() => '?').join(',');
}

async function getSuppliers(page = 1) {
    const offset = helper.getOffset(page, config.listPerPage);

    // 1. Fetch suppliers (users)
    const suppliersQuery = `
        SELECT userid, first_name, last_name
        FROM user
        LIMIT ?, ?
    `;
    let suppliers = await db.query(suppliersQuery, [offset, config.listPerPage]);

    // Ensure uniqueness explicitly (usually unnecessary if userid is PK)
    suppliers = Array.from(new Map(suppliers.map(s => [s.userid, s])).values());

    const supplierIds = suppliers.map(s => s.userid);
    if (supplierIds.length === 0) {
        return {
            data: [],
            meta: { page }
        };
    }

    // 2. Fetch products for these suppliers
    const productPlaceholders = generatePlaceholders(supplierIds);
    const productsQuery = `
        SELECT productid, userid, name, description, price, shipping_fee, categoryid, documents, datetime, status
        FROM product
        WHERE userid IN (${productPlaceholders})
            AND status = 'active'
    `;
    const products = await db.query(productsQuery, supplierIds);

    // 3. Fetch services for these suppliers
    const servicePlaceholders = generatePlaceholders(supplierIds);
    const servicesQuery = `
        SELECT serviceid, userid, name, description, price, categoryid, documents, datetime, status
        FROM service
        WHERE userid IN (${servicePlaceholders})
            AND status = 'active'
    `;
    const services = await db.query(servicesQuery, supplierIds);

    // 4. Combine suppliers with their products and services
    const supplierMap = {};
    suppliers.forEach(s => {
        supplierMap[s.userid] = {
            name: `${s.first_name} ${s.last_name}`,  // Flattened supplier name
            products: [],
            services: []
        };
    });

    products.forEach(p => {
        if (supplierMap[p.userid]) supplierMap[p.userid].products.push(p);
    });

    services.forEach(s => {
        if (supplierMap[s.userid]) supplierMap[s.userid].services.push(s);
    });

    const result = Object.values(supplierMap);

    return {
        data: result,
        meta: { page }
    };
}

module.exports = {
    getMultiple: getSuppliers
};
