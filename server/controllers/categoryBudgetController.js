const CategoryBudgetGoal = require("../models/CategoryBudgetGoal");

// Create or Update a category goal
const setCategoryGoal = async (req, res) => {
    try {
        const { categoryGoals } = req.body; // Get the array of category-goal pairs

        // Ensure categoryGoals is an array
        if (!Array.isArray(categoryGoals)) {
            return res.status(400).json({ message: "Invalid data format" });
        }

        // Loop through each categoryGoal and save it to the database
        for (let goalData of categoryGoals) {
            const { category, goal } = goalData;

            // Validate the category and goal values
            if (!category || goal === undefined) {
                return res.status(400).json({ message: "Category and goal are required" });
            }

            // Create or update the category goal in the database
            await CategoryBudgetGoal.findOneAndUpdate(
                { user: req.user, category },        // Match by user and category
                { goal, user: req.user },            // Set goal and user in case of insert
                { upsert: true, new: true }
              );              
        }

        res.status(200).json({ message: "Category goals updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error setting goal" });
    }
};


// Get all category goals
const getCategoryGoals = async (req, res) => {
    try {
        const userId = req.user;  // Assuming you store user ID in the JWT or session
        const categoryGoals = await CategoryBudgetGoal.find({ user: userId });

        // Format goals by category for frontend
        const formattedGoals = categoryGoals.map((goal) => ({
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
