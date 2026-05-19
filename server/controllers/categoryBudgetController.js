const Budget = require("../models/Budget");
const CategoryBudgetGoal = require("../models/CategoryBudgetGoal");

const setCategoryGoal = async (req, res) => {
    try {
        const { categoryGoals, monthlySavingsGoal } = req.body;

        if (!Array.isArray(categoryGoals)) {
            return res.status(400).json({ message: "Invalid data format" });
        }

        const categoryBudgets = {};
        categoryGoals.forEach(goalData => {
            const { category, goal } = goalData;
            if (category && category !== "Savings") {
                categoryBudgets[category] = Number(goal) || 0;
            }
        });

        const updateData = { categoryBudgets };
        if (monthlySavingsGoal !== undefined) {
            updateData.monthlySavingsGoal = Number(monthlySavingsGoal) || 0;
        }

        // 1. Update unified Budget collection
        await Budget.findOneAndUpdate(
            { userId: req.user },
            updateData,
            { upsert: true, new: true }
        );

        // 2. Synchronize legacy CategoryBudgetGoal collection for robust backward compatibility
        await Promise.all(categoryGoals.map(goalData => {
            const { category, goal } = goalData;
            if (!category || typeof goal !== 'number' || goal < 0) {
                return Promise.resolve();
            }
            return CategoryBudgetGoal.findOneAndUpdate(
                { user: req.user, category },
                { goal, user: req.user },
                { upsert: true, new: true }
            );
        }));

        if (monthlySavingsGoal !== undefined) {
            await CategoryBudgetGoal.findOneAndUpdate(
                { user: req.user, category: "Savings" },
                { goal: Number(monthlySavingsGoal) || 0, user: req.user },
                { upsert: true, new: true }
            );
        }

        res.status(200).json({ message: "Budget goals updated successfully" });
    } catch (err) {
        console.error("Error setting budget goals:", err);
        res.status(500).json({ message: err.message || "Error setting goal" });
    }
};

const getCategoryGoals = async (req, res) => {
    try {
        const userId = req.user;

        // 1. Try fetching unified Budget document
        let budget = await Budget.findOne({ userId });

        // 2. If no unified document exists, perform transparent migration from legacy CategoryBudgetGoal
        if (!budget) {
            const legacyGoals = await CategoryBudgetGoal.find({ user: userId });
            const categoryBudgets = { Food: 0, Entertainment: 0, Travel: 0, Utilities: 0, Others: 0 };
            let monthlySavingsGoal = 0;

            legacyGoals.forEach(g => {
                if (g.category === "Savings") {
                    monthlySavingsGoal = g.goal;
                } else if (g.category) {
                    categoryBudgets[g.category] = g.goal;
                }
            });

            budget = await Budget.create({
                userId,
                categoryBudgets,
                monthlySavingsGoal
            });
        }

        // Format categoryBudgets map back into array for frontend compatibility
        const formattedGoals = [];
        if (budget.categoryBudgets) {
            for (const [category, goal] of budget.categoryBudgets.entries()) {
                formattedGoals.push({ category, goal });
            }
        }

        res.status(200).json({
            categoryGoals: formattedGoals,
            monthlySavingsGoal: budget.monthlySavingsGoal || 0
        });
    } catch (err) {
        console.error("Error fetching category goals:", err);
        res.status(500).json({ message: "Error fetching category goals" });
    }
};

module.exports = {
    setCategoryGoal,
    getCategoryGoals,
};
