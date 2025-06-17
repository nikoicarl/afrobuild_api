const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const ProductRoute = require("./routes/productRoute");
const UserRoute = require("./routes/userRoute");

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get("/", (req, res) => {
    res.json({ message: "Server is running" });
});

// Routes
try {
    app.use("/products", ProductRoute);
    app.use("/users", UserRoute);
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
