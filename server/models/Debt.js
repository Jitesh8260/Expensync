const mongoose = require("mongoose");

// 📌 Debt Schema
const DebtSchema = new mongoose.Schema(
  {
    // Name of the person/entity to whom debt is owed
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },

    // Amount of debt (cannot be negative)
    amount: { 
      type: Number, 
      required: true, 
      min: 0 
    },

    // Reference to User who created this debt
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      index: true 
    },
  },
  { 
    timestamps: true // Automatically manages createdAt & updatedAt
  }
);

module.exports = mongoose.model("Debt", DebtSchema);
