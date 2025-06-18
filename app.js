const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const productRoute = require("./routes/productRoute");
const userRoute = require("./routes/userRoute");
const categoryRoute = require("./routes/categoryRoute");
const vendorRoute = require("./routes/vendorRoute");
const serviceRoute = require("./routes/serviceRoute");
const merchantRoute = require("./routes/merchantRoute");
const loginRoute = require("./routes/loginRoute");


// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get("/", (req, res) => {
    res.json({ message: "Server is running" });
});

// Routes
try {
    app.use("/products", productRoute);
    app.use("/users", userRoute);
    app.use("/category", categoryRoute);
    app.use("/vendors", vendorRoute);
    app.use("/services", serviceRoute);
    app.use("/merchants", merchantRoute);
    app.use("/login", loginRoute);
} catch (err) {
    console.error("Route loading error:", err.message);
}

// 404 handler for undefined routes
app.use((req, res, next) => {
    res.status(404).json({ message: "Route not found" });
});

// Central error handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    console.error("Internal error:", err.message);
    res.status(statusCode).json({ message: err.message || "Internal Server Error" });
});

// Start server
try {
    app.listen(port, () => {
        console.log(`Afrobuildlist API running at http://localhost:${port}`);
    });
} catch (err) {
    console.error("Server failed to start:", err.message);
}
