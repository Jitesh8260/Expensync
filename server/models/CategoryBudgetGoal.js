const mongoose = require("mongoose");

const categoryBudgetGoalSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true, 
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

categoryBudgetGoalSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model("CategoryBudgetGoal", categoryBudgetGoalSchema);
