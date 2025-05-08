const Transaction = require("../models/Transaction");

// Create a new transaction
exports.createTransaction = async (req, res) => {
    try {
        const { title, amount, category, note, tags, date } = req.body;
        const userId = req.user; // Get user ID from the authenticated user (from JWT)

        // Create a new transaction
        const newTransaction = new Transaction({
            title,
            amount,
            category,
            note,
            tags,
            date,
            userId,
        });

        // Save the transaction in the database
        const savedTransaction = await newTransaction.save();
        res.status(201).json(savedTransaction);  // Send the saved transaction data as response
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get all transactions for a user
exports.getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user }); // Use the authenticated user's ID
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: "Error fetching transactions", error });
    }
};

// Get transaction summary for the logged-in user
exports.getTransactionSummary = async (req, res) => {
    try {
        const userId = req.user; // Use the authenticated user's ID from req.user
        const transactions = await Transaction.find({ userId });

        let income = 0;
        let expense = 0;

        transactions.forEach(txn => {
            if (txn.amount >= 0) income += txn.amount;
            else expense += Math.abs(txn.amount);
        });

        const summary = {
            totalTransactions: transactions.length,
            income,
            expense,
            net: income - expense,
        };

        res.status(200).json(summary);
    } catch (error) {
        res.status(500).json({ message: "Error fetching transaction summary", error });
    }
};

// Get transactions by user ID (for admins or analytics)
exports.getTransactionsByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        const transactions = await Transaction.find({ userId });
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user transactions", error });
    }
};
