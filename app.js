const express = require('express');
const app = express();

// Middleware to handle JSON requests
app.use(express.json());

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});