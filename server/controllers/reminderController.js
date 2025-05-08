const Reminder = require("../models/Reminder");

exports.createReminder = async (req, res) => {
    try {
        const userId = req.user;
        const newReminder = new Reminder({ ...req.body, userId });
        const saved = await newReminder.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ message: "Error creating reminder", error: err });
    }
};

exports.getReminders = async (req, res) => {
    try {
        const userId = req.user;
        const reminders = await Reminder.find({ userId }).sort({ date: 1 });
        res.status(200).json(reminders);
    } catch (err) {
        res.status(500).json({ message: "Error fetching reminders", error: err });
    }
};

exports.deleteReminder = async (req, res) => {
    try {
        const { id } = req.params;
        await Reminder.findByIdAndDelete(id);
        res.status(200).json({ message: "Reminder deleted" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting reminder", error: err });
    }
};
