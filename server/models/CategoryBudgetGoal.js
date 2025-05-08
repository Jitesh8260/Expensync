const mongoose = require("mongoose");

const categoryBudgetGoalSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    goal: {
        type: Number,
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model("CategoryBudgetGoal", categoryBudgetGoalSchema);
