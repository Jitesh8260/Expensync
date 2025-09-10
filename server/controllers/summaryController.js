const mongoose = require("mongoose");
const CategoryBudgetGoal = require("../models/CategoryBudgetGoal");
const Transaction = require("../models/Transaction");

// Get Dashboard Summary for the user
const getBudgetSummary = async (req, res) => {
    try {
        // convert userId string to ObjectId
        const userId = new mongoose.Types.ObjectId(req.user);

        // 1️⃣ Total Budget (sum of all category goals)
        const budgetAgg = await CategoryBudgetGoal.aggregate([
            { $match: { user: userId } },
            { $group: { _id: null, totalBudget: { $sum: "$goal" } } }
        ]);
        const totalBudget = budgetAgg[0]?.totalBudget || 0;

        // 2️⃣ Total Income & Expenses aggregation
        const txAgg = await Transaction.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: null,
                    totalIncome: {
                        $sum: { $cond: [{ $gt: ["$amount", 0] }, "$amount", 0] }
                    },
                    totalExpenses: {
                        $sum: { $cond: [{ $lt: ["$amount", 0] }, { $abs: "$amount" }, 0] }
                    },
                    totalCount: { $sum: 1 }
                }
            }
        ]);

        const totalIncome = txAgg?.[0]?.totalIncome || 0;
        const totalExpenses = txAgg?.[0]?.totalExpenses || 0;
        const totalTransactions = txAgg?.[0]?.totalCount || 0;

        // 3️⃣ Recent 3 transactions (descending by date)
        const recentTransactions = await Transaction.find({ userId })
            .sort({ createdAt: -1 })
            .limit(3)
            .lean();

        // 4️⃣ Savings
        const savings = totalBudget - totalExpenses;

        // 5️⃣ Response
        res.status(200).json({
            totalIncome,
            totalExpenses,
            totalBudget,
            savings,
            recentTransactions,
            totalTransactions
        });
    } catch (error) {
        console.error("Error fetching dashboard summary:", error);
        res.status(500).json({ message: "Error fetching dashboard summary", error: error.message });
    }
};

module.exports = {
    getBudgetSummary
};
