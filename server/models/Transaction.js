const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      index: true 
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
        "Utilities",
        "Income", 
        "Others"
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

    // AI Metadata Fields (Flat Structure)
    source: {
      type: String,
      enum: ["manual", "nlp", "ocr", "recurring"],
      default: "manual",
      trim: true
    },
    
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 100 // Manual entries have 100% confidence
    },

    merchant: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { 
    timestamps: true 
  }
);

module.exports = mongoose.model("Transaction", TransactionSchema);
