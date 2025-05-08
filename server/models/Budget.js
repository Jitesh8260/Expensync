const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
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
  spent: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model("Budget", budgetSchema);
