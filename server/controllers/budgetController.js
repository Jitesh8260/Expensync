const Budget = require("../models/Budget");
const CategoryBudgetGoal = require("../models/CategoryBudgetGoal");

// Set or Update Budget Goal for a Single Category
const setCategoryGoal = async (req, res) => {
  const { category, goal } = req.body;
  const userId = req.user.id;

  try {
    let budget = await Budget.findOne({ userId });

    if (!budget) {
      const categoryBudgets = { Food: 0, Entertainment: 0, Travel: 0, Utilities: 0, Others: 0 };
      if (category && category !== "Savings") {
        categoryBudgets[category] = Number(goal) || 0;
      }
      budget = new Budget({ userId, categoryBudgets, monthlySavingsGoal: 0 });
      await budget.save();
    } else {
      if (category && category !== "Savings") {
        budget.categoryBudgets.set(category, Number(goal) || 0);
        await budget.save();
      }
    }

    // Keep legacy collection synced
    if (category) {
      await CategoryBudgetGoal.findOneAndUpdate(
        { user: userId, category },
        { goal: Number(goal) || 0, user: userId },
        { upsert: true }
      );
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
    const budget = await Budget.findOne({ userId });
    const formattedBudgets = [];

    if (budget && budget.categoryBudgets) {
      for (const [category, goal] of budget.categoryBudgets.entries()) {
        formattedBudgets.push({ category, goal, spent: 0 });
      }
    }

    res.status(200).json(formattedBudgets);
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
    const budget = await Budget.findOne({ userId });

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    if (category && budget.categoryBudgets.has(category)) {
      budget.categoryBudgets.delete(category);
      await budget.save();
    }

    await CategoryBudgetGoal.findOneAndDelete({ user: userId, category });

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
