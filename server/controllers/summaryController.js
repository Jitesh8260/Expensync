const CategoryBudgetGoal = require("../models/CategoryBudgetGoal");
const Transaction = require("../models/Transaction"); // Assuming your Transaction model has a type field to distinguish income/expense

// Get Budget Summary for the user
const getBudgetSummary = async (req, res) => {
    try {
        // Fetch all category goals for the user
        const goals = await CategoryBudgetGoal.find({ user: req.user });

        // Calculate Total Budget (sum of all category goals)
        const totalBudget = goals.reduce((acc, goal) => acc + goal.goal, 0);

        // Fetch all transactions (expenses and income) for the user
        const transactions = await Transaction.find({ userId: req.user });

        // Calculate Total Expenses (sum of all expense transactions)
        const totalExpenses = transactions
            .filter((transaction) => transaction.amount < 0)
            .reduce((acc, transaction) => acc + Math.abs(transaction.amount), 0); // expenses are negative, make them positive

        const totalIncome = transactions
            .filter((transaction) => transaction.amount > 0)
            .reduce((acc, transaction) => acc + transaction.amount, 0);


        // Calculate Savings (Total Budget - Total Expenses)
        const savings = totalBudget - totalExpenses;

        // Respond with the summary data
        res.status(200).json({
            totalIncome,
            totalExpenses,
            totalBudget,
            savings,
        });
    } catch (error) {
        console.error("Error fetching budget summary:", error);
        res.status(500).json({ message: "Error fetching summary", error: error.message });
    }
};

module.exports = {
    getBudgetSummary,
};
