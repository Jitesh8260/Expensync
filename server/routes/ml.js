const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const mlController = require("../controllers/mlController");

// Trigger model retraining for authenticated user
router.post("/train", authMiddleware, mlController.trainModel);

// Get spending prediction for authenticated user
router.get("/predict-spending", authMiddleware, mlController.predictSpending);

// Get ML service health status
router.get("/status", authMiddleware, mlController.getStatus);

// Get behavioral financial insights for authenticated user
router.get("/financial-insights", authMiddleware, mlController.getFinancialInsights);

module.exports = router;
