const express = require("express");
const router = express.Router();
const { getBudgetSummary } = require("../controllers/summaryController");
const authMiddleware = require("../middleware/auth");

// Route to get the budget summary
router.get("/summary", authMiddleware, getBudgetSummary);

module.exports = router;
