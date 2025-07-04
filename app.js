require('dotenv').config({ path: 'system.env' });

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;
const environment = process.env.NODE_ENV || "development";
const host = process.env.HOST || "localhost";

// === Logging Setup ===
const logFilePath = path.join(__dirname, "server.log");
function logToFile(message) {
    const timestamp = new Date().toISOString();
    const fullMessage = `[${timestamp}] ${message}\n`;
    fs.appendFile(logFilePath, fullMessage, err => {
        if (err) console.error("Error writing to log file:", err.message);
    });
}

// === Middleware ===
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === Allow All CORS ===
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));


// === Routes ===
const routes = [
    { path: "/products", route: require("./routes/productRoute") },
    { path: "/user", route: require("./routes/userRoute") },
    { path: "/category", route: require("./routes/categoryRoute") },
    { path: "/vendors", route: require("./routes/vendorRoute") },
    { path: "/services", route: require("./routes/serviceRoute") },
    { path: "/merchants", route: require("./routes/merchantRoute") },
    { path: "/login", route: require("./routes/loginRoute") },
    { path: "/signup", route: require("./routes/signupRoute") }
];

// === Root Route ===
app.get("/", (req, res) => {
    res.json({ message: "Afrobuildlist API is running" });
    logToFile("Accessed root route");
});

// === Apply Routes ===
routes.forEach(({ path, route }) => {
    try {
        app.use(path, route);
    } catch (err) {
        const errorMsg = `Failed to load route '${path}': ${err.message}`;
        console.error(errorMsg);
        logToFile(errorMsg);
    }
});

// === 404 Not Found Handler ===
app.use((req, res) => {
    const msg = `404 - Not Found: ${req.originalUrl}`;
    res.status(404).json({ message: "Route not found" });
    logToFile(msg);
});

// === Central Error Handler ===
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const errorMsg = `Error ${statusCode}: ${err.message}`;
    res.status(statusCode).json({ message: err.message || "Internal Server Error" });
    logToFile(errorMsg);
});

// === Start Server ===
app.listen(port, () => {
    const baseUrl = environment === "production"
        ? `https://${host}`
        : `http://${host}:${port}`;

    const startMsg = `Afrobuildlist API running in ${environment} mode at ${baseUrl}`;
    console.log(startMsg);
    logToFile(startMsg);
});
