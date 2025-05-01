const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");

// @route   POST /api/transactions
// @desc    Add transaction
router.post("/", async (req, res) => {
    try {
        const { title, amount, category, userId } = req.body;

        const txn = new Transaction({ title, amount, category, userId });
        await txn.save();

        res.status(201).json(txn);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server Error" });
    }
});

// @route   GET /api/transactions/:userId
// @desc    Get all transactions for a user
router.get("/:userId", async (req, res) => {
    try {
        const txns = await Transaction.find({ userId: req.params.userId }).sort({ date: -1 });
        res.json(txns);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server Error" });
    }
});

module.exports = router;
