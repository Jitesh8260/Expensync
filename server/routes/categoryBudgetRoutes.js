const express = require("express");
const router = express.Router();
const { setCategoryGoal, getCategoryGoals } = require("../controllers/categoryBudgetController");
const authMiddleware = require("../middleware/auth");

router.post("/set", authMiddleware, setCategoryGoal);
router.get("/", authMiddleware, getCategoryGoals);

module.exports = router;
