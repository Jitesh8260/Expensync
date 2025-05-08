const Debt = require("../models/Debt");
const User = require("../models/User"); 
// Create a new debt
const createDebt = async (req, res) => {
    try {
        // Extract user ID from req.user (the decoded JWT token)
        const userId = req.user;

        // Create a new debt document
        const newDebt = new Debt({
            name: req.body.name,
            amount: req.body.amount,
            user: userId,  // Ensure this is set
        });

        // Save the debt document to the database
        const savedDebt = await newDebt.save();
        res.status(201).json(savedDebt); // Send back the saved debt
    } catch (error) {
        console.error("Error creating debt:", error);
        res.status(500).json({ message: "Error creating debt", error: error.message });
    }
};


// Get all debts for the authenticated user
const getDebts = async (req, res) => {
    try {
        console.log("User ID: ", req.user); // Debugging line
        const debts = await Debt.find({ user: req.user });
        res.status(200).json(debts);
    } catch (error) {
        res.status(500).json({ message: "Error fetching debts", error: error.message });
    }
};

// Delete a debt by ID
const deleteDebt = async (req, res) => {
    const { id } = req.params;

    try {
        const debt = await Debt.findById(id);

        if (!debt) {
            return res.status(404).json({ message: "Debt not found" });
        }


        if (debt.user.toString() !== req.user.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }


        await debt.deleteOne();
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
