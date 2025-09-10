const CategoryBudgetGoal = require("../models/CategoryBudgetGoal");

const setCategoryGoal = async (req, res) => {
    try {
        const { categoryGoals } = req.body;

        if (!Array.isArray(categoryGoals)) {
            return res.status(400).json({ message: "Invalid data format" });
        }

        await Promise.all(categoryGoals.map(goalData => {
            const { category, goal } = goalData;

            if (!category || typeof goal !== 'number' || goal < 0) {
                throw new Error("Invalid category or goal");
            }

            return CategoryBudgetGoal.findOneAndUpdate(
                { user: req.user, category },
                { goal, user: req.user },
                { upsert: true, new: true }
            );
        }));

        res.status(200).json({ message: "Category goals updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message || "Error setting goal" });
    }
};

const getCategoryGoals = async (req, res) => {
    try {
        const userId = req.user;
        const categoryGoals = await CategoryBudgetGoal.find({ user: userId })
                                                      .sort({ category: 1 }); // optional sorting

        const formattedGoals = categoryGoals.map(goal => ({
            category: goal.category,
            goal: goal.goal,
        }));

        res.status(200).json({ categoryGoals: formattedGoals });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching category goals" });
    }
};

module.exports = {
    setCategoryGoal,
    getCategoryGoals,
};
