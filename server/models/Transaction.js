const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        enum: ["Food", "Bills", "Shopping", "Travel", "Others"], // customize as needed
        default: "Others",
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Transaction", TransactionSchema);
