/**
 * mlController.js
 * 
 * Express controller for ML service proxy routes.
 * Express remains API owner — these endpoints proxy to Flask.
 * All endpoints degrade gracefully if Flask is unavailable.
 */

const mlBridgeService = require("../services/mlBridgeService");

/**
 * POST /api/v1/ml/train
 * Trigger model retraining for the authenticated user.
 */
exports.trainModel = async (req, res) => {
  try {
    const userId = req.user;
    const force = req.body.force === true;

    if (!mlBridgeService.isAvailable()) {
      return res.status(503).json({
        success: false,
        msg: "ML service is currently unavailable. The deterministic engine continues to work normally."
      });
    }

    const success = await mlBridgeService.triggerTraining(userId, force);
    if (success) {
      res.status(200).json({ success: true, msg: "Model training initiated successfully." });
    } else {
      res.status(500).json({ success: false, msg: "Training failed. Check ML service logs." });
    }
  } catch (error) {
    console.error("ML Train Error:", error.message);
    res.status(500).json({ success: false, msg: "Training request failed." });
  }
};

/**
 * GET /api/v1/ml/predict-spending
 * Get spending prediction for the authenticated user.
 */
exports.predictSpending = async (req, res) => {
  try {
    const userId = req.user;
    const months = parseInt(req.query.months) || 6;

    if (!mlBridgeService.isAvailable()) {
      return res.status(200).json({
        predictions: { Food: 0, Entertainment: 0, Travel: 0, Utilities: 0, Others: 0, total: 0 },
        alerts: [{ type: "info", category: "General", message: "ML service is currently offline. Showing baseline zero spending forecast." }],
        predictionSource: "fallback-offline"
      });
    }

    const result = await mlBridgeService.predictSpending(userId, months);
    if (!result) {
      return res.status(200).json({
        predictions: { Food: 0, Entertainment: 0, Travel: 0, Utilities: 0, Others: 0, total: 0 },
        alerts: [{ type: "info", category: "General", message: "Spending forecast currently unavailable. Showing baseline zero forecast." }],
        predictionSource: "fallback-error"
      });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("ML Predict Spending Error:", error.message);
    res.status(200).json({
      predictions: { Food: 0, Entertainment: 0, Travel: 0, Utilities: 0, Others: 0, total: 0 },
      alerts: [{ type: "info", category: "General", message: "Spending forecast request failed. Showing baseline zero forecast." }],
      predictionSource: "fallback-catch"
    });
  }
};

/**
 * GET /api/v1/ml/financial-insights
 * Get behavioral financial insights for the authenticated user.
 */
exports.getFinancialInsights = async (req, res) => {
  try {
    const userId = req.user;
    const months = parseInt(req.query.months) || 6;

    const result = await mlBridgeService.getFinancialInsights(userId, months);
    res.status(200).json(result);
  } catch (error) {
    console.error("ML Financial Insights Error:", error.message);
    const pristineFallback = {
      summary: { totalIncome: 0, totalExpense: 0, netSavings: 0, savingsRate: 0 },
      financialHealth: { score: 70, grade: "Stable", message: "Start adding transactions to unlock your AI Financial Health Score!", confidence: 0 },
      safeToSpend: { amount: 0, message: "Set up your monthly income and budgets to calculate Safe-to-Spend.", confidence: 0 },
      budgetRisk: [],
      smartBudgets: {
        Food: { recommended: 1000, average3m: 0, message: "Recommended Food budget: ₹1,000.", confidence: 0 },
        Entertainment: { recommended: 1000, average3m: 0, message: "Recommended Entertainment budget: ₹1,000.", confidence: 0 },
        Utilities: { recommended: 1000, average3m: 0, message: "Recommended Utilities budget: ₹1,000.", confidence: 0 },
        Travel: { recommended: 1000, average3m: 0, message: "Recommended Travel budget: ₹1,000.", confidence: 0 },
        Savings: { recommended: 1000, average3m: 0, message: "Recommended Savings budget: ₹1,000.", confidence: 0 },
        Others: { recommended: 1000, average3m: 0, message: "Recommended Others budget: ₹1,000.", confidence: 0 }
      },
      savingsForecast: { monthlySavings: 0, projectedAnnual: 0, message: "Log your monthly income to unlock savings projections.", confidence: 0 },
      recurringExpenses: [],
      anomalies: [],
      spendingTrends: [],
      personalityInsights: [],
      categoryDominance: []
    };
    res.status(200).json(pristineFallback);
  }
};

/**
 * GET /api/v1/ml/status
 * Returns ML service health status and availability.
 */
exports.getStatus = async (req, res) => {
  try {
    const available = mlBridgeService.isAvailable();
    res.status(200).json({
      mlServiceAvailable: available,
      mode: available ? "hybrid" : "deterministic-only",
      msg: available
        ? "ML service is active. Hybrid intelligence mode enabled."
        : "ML service is offline. Deterministic engine is fully operational."
    });
  } catch (error) {
    res.status(200).json({
      mlServiceAvailable: false,
      mode: "deterministic-only",
      msg: "Deterministic engine is fully operational."
    });
  }
};
