const express = require("express");
const router = express.Router();
const Budget = require("../models/Budget");

// GET all budgets for a user
router.get("/:userId", async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.params.userId });
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong!" });
  }
});

// POST new budget
router.post("/", async (req, res) => {
  try {
    const newBudget = new Budget(req.body);
    const saved = await newBudget.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: "Invalid data" });
  }
});

module.exports = router;
