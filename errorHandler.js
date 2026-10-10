const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map(
      (error) => error.message
    );

    return res.status(400).json({
      message: "Validation failed",
      errors: errors
    });
  }

  // Duplicate SKU error
  if (err.code === 11000) {
    return res.status(400).json({
      message: "SKU already exists"
    });
  }

  // Invalid MongoDB ID
  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Invalid product ID"
    });
  }

  // General error
  res.status(500).json({
    message: "Internal Server Error",
    error: err.message
  });
};

module.exports = errorHandler;
