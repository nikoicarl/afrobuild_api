const express = require("express");
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const logFilePath = path.join(__dirname, 'server.log');
function logToFile(message) {
    const timestamp = new Date().toISOString();
    fs.appendFile(logFilePath, `[${timestamp}] ${message}\n`, err => {
        if (err) console.error('Log write error:', err);
    });
}

const productRoute = require("./routes/productRoute");
const userRoute = require("./routes/userRoute");
const categoryRoute = require("./routes/categoryRoute");
const vendorRoute = require("./routes/vendorRoute");
const serviceRoute = require("./routes/serviceRoute");
const merchantRoute = require("./routes/merchantRoute");
const loginRoute = require("./routes/loginRoute");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
    res.json({ message: "Server is running" });
});

try {
    app.use("/products", productRoute);
    app.use("/user", userRoute);
    app.use("/category", categoryRoute);
    app.use("/vendors", vendorRoute);
    app.use("/services", serviceRoute);
    app.use("/merchants", merchantRoute);
    app.use("/login", loginRoute);
} catch (err) {
    logToFile(`Route loading error: ${err.message}`);
}

app.use((req, res, next) => {
    res.status(404).json({ message: "Route not found" });
    logToFile(`404 - Not Found: ${req.originalUrl}`);
});

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    logToFile(`Internal error: ${err.message}`);
    res.status(statusCode).json({ message: err.message || "Internal Server Error" });
});

try {
    app.listen(port, () => {
        const msg = `Afrobuildlist API running at http://localhost:${port}`;
        console.log(msg);
        logToFile(msg);
    });
} catch (err) {
    logToFile(`Server failed to start: ${err.message}`);
}
