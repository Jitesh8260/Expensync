const Debt = require("../models/Debt");

const createDebt = async (req, res) => {
    try {
        const { name, amount } = req.body;

        if (!name || typeof amount !== 'number' || amount < 0) {
            return res.status(400).json({ message: "Invalid name or amount" });
        }

        const newDebt = new Debt({ name, amount, user: req.user });
        const savedDebt = await newDebt.save();

        res.status(201).json(savedDebt);
    } catch (error) {
        console.error("Error creating debt:", error);
        res.status(500).json({ message: "Error creating debt", error: error.message });
    }
};

const getDebts = async (req, res) => {
    try {
        const debts = await Debt.find({ user: req.user }).sort({ createdAt: -1 });
        res.status(200).json(debts);
    } catch (error) {
        res.status(500).json({ message: "Error fetching debts", error: error.message });
    }
};

const deleteDebt = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedDebt = await Debt.findOneAndDelete({ _id: id, user: req.user });
        if (!deletedDebt) return res.status(404).json({ message: "Debt not found or unauthorized" });

        res.status(200).json({ message: "Debt deleted successfully" });
    } catch (error) {
        console.error("Error deleting debt:", error);
        res.status(500).json({ message: "Error deleting debt", error: error.message });
    }
};

module.exports = {
    createDebt,
    getDebts,
    deleteDebt,
};
