const mongoose = require("mongoose");
const Budget = require("../models/Budget");
const CategoryBudgetGoal = require("../models/CategoryBudgetGoal");
const Transaction = require("../models/Transaction");

// Get Dashboard Summary for the user
const getBudgetSummary = async (req, res) => {
    try {
        // convert userId string to ObjectId
        const userId = new mongoose.Types.ObjectId(req.user);

        // 1️⃣ Total Budget (sum of all category goals) & Monthly Savings Goal
        const budgetDoc = await Budget.findOne({ userId });
        let totalBudget = 0;
        let monthlySavingsGoal = 0;

        if (budgetDoc) {
            if (budgetDoc.categoryBudgets) {
                for (const goal of budgetDoc.categoryBudgets.values()) {
                    totalBudget += (Number(goal) || 0);
                }
            }
            monthlySavingsGoal = budgetDoc.monthlySavingsGoal || 0;
        } else {
            // Fallback to legacy collection if unified document not yet created
            const legacyGoals = await CategoryBudgetGoal.find({ user: userId });
            legacyGoals.forEach(g => {
                if (g.category === "Savings") {
                    monthlySavingsGoal = g.goal;
                } else if (g.category) {
                    totalBudget += g.goal;
                }
            });
        }

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
        const savings = totalIncome - totalExpenses;

        // 5️⃣ Response
        res.status(200).json({
            totalIncome,
            totalExpenses,
            totalBudget,
            savings,
            monthlySavingsGoal,
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
