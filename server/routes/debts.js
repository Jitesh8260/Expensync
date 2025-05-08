const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const debtController = require("../controllers/debtController");

// Create a new debt
router.post("/create", authMiddleware, debtController.createDebt);

// Get all debts for the authenticated user
router.get("/", authMiddleware, debtController.getDebts);

// Delete a debt by ID
router.delete("/:id", authMiddleware, debtController.deleteDebt);

module.exports = router;
