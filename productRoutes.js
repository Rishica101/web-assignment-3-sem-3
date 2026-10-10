const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");

const router = express.Router();


// ===============================
// CREATE PRODUCT
// POST /api/products
// ===============================

router.post("/", async (req, res, next) => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});
// ===============================
// GET ALL PRODUCTS
// Filtering, Sorting & Pagination
// GET /api/products
// ===============================

router.get("/", async (req, res, next) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 10
    } = req.query;

    const filter = {};

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Search by product name
    if (search) {
      filter.name = {
        $regex: search,
        $options: "i"
      };
    }

    // Minimum price
    if (minPrice) {
      filter.price = {
        ...filter.price,
        $gte: Number(minPrice)
      };
    }

    // Maximum price
    if (maxPrice) {
      filter.price = {
        ...filter.price,
        $lte: Number(maxPrice)
      };
    }

    // Pagination
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const skip = (pageNumber - 1) * limitNumber;

    // Sorting
    const sortOrder = order === "asc" ? 1 : -1;

    const sort = {};
    sort[sortBy] = sortOrder;

    // Get products
    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNumber);

    // Count total matching products
    const total = await Product.countDocuments(filter);

    res.status(200).json({
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
      count: products.length,
      products
    });

  } catch (error) {
    next(error);
  }
});
// ===============================
// LOW STOCK REPORT
// GET /api/products/low-stock
// ===============================

router.get("/low-stock", async (req, res, next) => {
  try {
    const lowStockItems = await Product.find({
      $expr: {
        $lte: ["$quantity", "$reorderLevel"]
      }
    }).sort({ quantity: 1 });

    res.status(200).json({
      count: lowStockItems.length,
      lowStockItems
    });

  } catch (error) {
    next(error);
  }
});


// ===============================
// CATEGORY-WISE INVENTORY SUMMARY
// GET /api/products/summary
// ===============================

router.get("/summary", async (req, res, next) => {
  try {
    const summary = await Product.aggregate([
      {
        $group: {
          _id: "$category",

          totalItems: {
            $sum: 1
          },

          totalQuantity: {
            $sum: "$quantity"
          },

          totalStockValue: {
            $sum: {
              $multiply: ["$price", "$quantity"]
            }
          },

          avgPrice: {
            $avg: "$price"
          }
        }
      },

      {
        $sort: {
          totalStockValue: -1
        }
      }
    ]);

    res.status(200).json({
      categories: summary.length,
      summary
    });

  } catch (error) {
    next(error);
  }
});
// ===============================
// GET SINGLE PRODUCT
// GET /api/products/:id
// ===============================

router.get("/:id", async (req, res, next) => {
  try {
    // Check whether ID is valid
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid product ID"
      });
    }

    const product = await Product.findById(req.params.id);

    // Product not found
    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.status(200).json(product);

  } catch (error) {
    next(error);
  }
});


// ===============================
// UPDATE PRODUCT
// PUT /api/products/:id
// ===============================

router.put("/:id", async (req, res, next) => {
  try {
    // Check whether ID is valid
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid product ID"
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    // Product not found
    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.status(200).json(product);

  } catch (error) {
    next(error);
  }
});
// ===============================
// DELETE PRODUCT
// DELETE /api/products/:id
// ===============================

router.delete("/:id", async (req, res, next) => {
  try {
    // Check whether ID is valid
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid product ID"
      });
    }

    const product = await Product.findByIdAndDelete(req.params.id);

    // Product not found
    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.status(200).json({
      message: "Product deleted successfully",
      id: req.params.id
    });

  } catch (error) {
    next(error);
  }
});


// ===============================
// STOCK ADJUSTMENT
// PATCH /api/products/:id/stock
// ===============================

router.patch("/:id/stock", async (req, res, next) => {
  try {
    // Check whether ID is valid
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid product ID"
      });
    }

    const { change } = req.body;

    // Check change value
    if (typeof change !== "number") {
      return res.status(400).json({
        message: "Change must be a number"
      });
    }

    const product = await Product.findById(req.params.id);

    // Product not found
    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    // Calculate new quantity
    const newQuantity = product.quantity + change;

    // Prevent negative stock
    if (newQuantity < 0) {
      return res.status(400).json({
        message: "Stock cannot become negative"
      });
    }

    product.quantity = newQuantity;

    await product.save();

    res.status(200).json({
      message: "Stock updated successfully",
      product
    });

  } catch (error) {
    next(error);
  }
});


// ===============================
// EXPORT ROUTER
// ===============================

module.exports = router;
