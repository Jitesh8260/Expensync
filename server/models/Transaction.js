const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      index: true // 🔥 fast queries per user
    },

    title: { 
      type: String, 
      required: true, 
      trim: true 
    },

    amount: { 
      type: Number, 
      required: true,
    },

    category: { 
      type: String, 
      enum: [
        "Food", 
        "Entertainment", 
        "Travel", 
        "Shopping", 
        "Savings", 
        "Others", 
        "Utilities"
      ], 
      default: "Others", 
      trim: true 
    },

    note: { 
      type: String, 
      default: "", 
      trim: true 
    },

    tags: [{ 
      type: String, 
      trim: true 
    }],

    date: { 
      type: Date, 
      default: Date.now, 
      index: true // 🔥 useful for sorting/filtering
    },
  },
  { 
    timestamps: true 
  }
);

module.exports = mongoose.model("Transaction", TransactionSchema);
