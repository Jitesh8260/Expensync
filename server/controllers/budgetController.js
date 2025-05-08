const Budget = require("../models/Budget");

// Set or Update Budget Goal for a Category
const setCategoryGoal = async (req, res) => {
  const { category, goal } = req.body;
  const userId = req.user.id;

  try {
    let budget = await Budget.findOne({ user: userId, category });

    if (budget) {
      budget.goal = goal;
      await budget.save();
    } else {
      budget = new Budget({ user: userId, category, goal });
      await budget.save();
    }

    res.status(200).json(budget);
  } catch (err) {
    console.error("Set Budget Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get All Budgets for Logged-in User
const getCategoryGoals = async (req, res) => {
  const userId = req.user.id;

  try {
    const budgets = await Budget.find({ user: userId });
    res.status(200).json(budgets);
  } catch (err) {
    console.error("Get Budgets Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a Budget Goal
const deleteCategoryGoal = async (req, res) => {
  const userId = req.user.id;
  const { category } = req.params;

  try {
    const result = await Budget.findOneAndDelete({ user: userId, category });

    if (!result) {
      return res.status(404).json({ message: "Budget not found" });
    }

    res.status(200).json({ message: "Budget deleted successfully" });
  } catch (err) {
    console.error("Delete Budget Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  setCategoryGoal,
  getCategoryGoals,
  deleteCategoryGoal,
};
