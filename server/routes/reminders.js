const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const reminderController = require("../controllers/reminderController");

// Create reminder
router.post("/create", authMiddleware, reminderController.createReminder);

// Get all reminders
router.get("/", authMiddleware, reminderController.getReminders);

// Delete reminder
router.delete("/:id", authMiddleware, reminderController.deleteReminder);

module.exports = router;
