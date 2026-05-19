const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  categoryBudgets: {
    type: Map,
    of: Number,
    default: { Food: 0, Entertainment: 0, Travel: 0, Utilities: 0, Others: 0 },
  },
  monthlySavingsGoal: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model("Budget", budgetSchema);
