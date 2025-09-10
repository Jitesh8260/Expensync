const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true, 
      trim: true 
    },

    amount: { 
      type: Number, 
      required: true, 
      min: 0 
    },

    category: { 
      type: String, 
      default: "Others", 
      trim: true 
    },

    date: { 
      type: Date, 
      required: true 
    }, 

    isRecurring: { 
      type: Boolean, 
      default: false 
    },

    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      index: true 
    }, 
  },
  { 
    timestamps: true 
  }
);

module.exports = mongoose.model("Reminder", reminderSchema);
