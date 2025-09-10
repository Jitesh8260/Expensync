const Reminder = require("../models/Reminder");

// Create a new reminder
exports.createReminder = async (req, res) => {
    try {
        const userId = req.user;
        const { title, amount, category, date, isRecurring } = req.body;

        // Validation
        if (!title || amount === undefined || !date) {
            return res.status(400).json({ message: "Title, amount, and date are required" });
        }

        const reminder = new Reminder({
            title: title.trim(),
            amount: Number(amount),
            category: category?.trim() || "Others",
            date: new Date(date),
            isRecurring: Boolean(isRecurring),
            userId,
        });

        const saved = await reminder.save();
        res.status(201).json(saved);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error creating reminder", error: err.message });
    }
};

// Get all reminders for authenticated user
exports.getReminders = async (req, res) => {
    try {
        const userId = req.user;
        const reminders = await Reminder.find({ userId }).sort({ date: 1 });
        res.status(200).json(reminders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching reminders", error: err.message });
    }
};

// Delete reminder by ID with authorization check
exports.deleteReminder = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user;

        const reminder = await Reminder.findOneAndDelete({ _id: id, userId });
        if (!reminder) {
            return res.status(404).json({ message: "Reminder not found or unauthorized" });
        }

        res.status(200).json({ message: "Reminder deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error deleting reminder", error: err.message });
    }
};
