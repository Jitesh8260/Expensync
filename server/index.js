const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(helmet());
const allowedOrigin = process.env.ALLOWED_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

// Test Route
app.get("/", (req, res) => {
  res.send("API running 🎯");
});

app.get("/api/v1", (req, res) => {
  res.send("Backend is running!");
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// API Routes
app.use("/api/v1/auth", require("./routes/auth"));
app.use("/api/v1/transactions", require("./routes/transactions"));
app.use("/api/v1/budgets", require("./routes/budgets"));
app.use("/api/v1/category-goals", require("./routes/categoryBudgetRoutes"));
app.use("/api/v1/debts", require("./routes/debts"));
app.use("/api/v1/summary", require("./routes/summary"));     
app.use("/api/v1/reminders", require("./routes/reminders"));
app.use("/api/v1/ai", require("./routes/ai"));
app.use("/api/v1/ml", require("./routes/ml"));

// Health Check Route
app.get("/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.status(dbStatus === "connected" ? 200 : 503).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date(),
    database: dbStatus,
  });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error("💥 Unhandled Error:", err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
