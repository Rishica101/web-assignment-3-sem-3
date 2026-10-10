const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const productRoutes = require("./routes/productRoutes");
const errorHandler = require("./middleware/errorHandler");

dotenv.config();

const app = express();


// ===============================
// MIDDLEWARE
// ===============================

app.use(express.json());


// ===============================
// HOME ROUTE
// ===============================

app.get("/", (req, res) => {
  res.json({
    message: "Inventory and Data Management API is running"
  });
});


// ===============================
// PRODUCT ROUTES
// ===============================

app.use("/api/products", productRoutes);


// ===============================
// ERROR HANDLER
// ===============================

app.use(errorHandler);


// ===============================
// MONGODB CONNECTION
// ===============================

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });
  