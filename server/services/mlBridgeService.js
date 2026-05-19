/**
 * mlBridgeService.js
 * 
 * RESPONSIBILITY: Express ↔ Flask ML communication ONLY.
 * Uses Node's built-in http module — zero new dependencies.
 * 
 * Production failsafes:
 * - 2-second hard timeout on all prediction calls
 * - Health check polling every 30s with cached status
 * - Response schema validation before trusting Flask output
 * - All methods return null on ANY error (callers always have deterministic fallback)
 */

const http = require("http");
const { ML_CONFIG } = require("./keywordKnowledgeBase");

const VALID_CATEGORIES = ["Food", "Entertainment", "Travel", "Utilities", "Income", "Others"];

class MLBridgeService {
  constructor() {
    this._healthy = false;
    this._lastHealthCheck = 0;
    this._healthCheckTimer = null;
    this._startHealthPolling();
  }

  // ─── Public API ────────────────────────────────────────────────────

  /**
   * Check if ML service is currently available (cached health status).
   * @returns {boolean}
   */
  isAvailable() {
    // Eliminate async startup race condition: assume true until first check completes
    if (this._lastHealthCheck === 0) return true;
    return this._healthy;
  }

  /**
   * Request KNN category prediction from Flask.
   * @param {Object} featureVector - { normalizedText, canonicalMerchant, entityType, intent }
   * @returns {Promise<{ category: string, probability: number, modelVersion: number }|null>}
   */
  async predictCategory(featureVector, userId) {
    try {
      // If unhealthy but hasn't been checked recently or at startup, perform an immediate health check
      if (!this._healthy && (this._lastHealthCheck === 0 || Date.now() - this._lastHealthCheck > 10000)) {
        await this._checkHealth();
      }

      if (!this._healthy) {
        console.log("⚠️ [ML Bridge] ML service is marked offline. Activating deterministic fallback.");
        return null;
      }

      const payload = {
        text: featureVector.normalizedText || "",
        canonicalMerchant: featureVector.canonicalMerchant || "",
        entityType: featureVector.entityType || "unknown",
        intent: featureVector.intent || "generic_expense",
        userId: userId || ""
      };

      console.log(`📤 [ML Bridge] Outgoing prediction payload:`, JSON.stringify(payload));
      const response = await this._post("/predict-category", payload);

      // Response validation
      if (!response || typeof response !== "object") {
        console.log("❌ [ML Bridge] Received empty or malformed response from Flask.");
        return null;
      }
      if (response.error === "no_model") {
        console.log("⚠️ [ML Bridge] Flask reported no_model. Cold start user fallback active.");
        return null;
      }
      if (!response.category || !VALID_CATEGORIES.includes(response.category)) {
        console.log(`❌ [ML Bridge] Invalid category received: ${response.category}`);
        return null;
      }
      if (typeof response.probability !== "number" || response.probability < 0 || response.probability > 1) {
        console.log(`❌ [ML Bridge] Invalid probability received: ${response.probability}`);
        return null;
      }

      console.log(`📥 [ML Bridge] Incoming ML response:`, JSON.stringify(response));
      return {
        category: response.category,
        probability: response.probability,
        modelVersion: response.modelVersion || 0
      };
    } catch (err) {
      console.log(`❌ [ML Bridge] Prediction request failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Request spending prediction from Flask.
   * @param {string} userId
   * @param {number} months - Number of months of history to use
   * @returns {Promise<Object|null>}
   */
  async predictSpending(userId, months = 6) {
    try {
      const response = await this._get(`/predict-spending?userId=${userId}&months=${months}`);
      if (!response || typeof response !== "object") return null;
      if (response.error === "insufficient_data") return { insufficientData: true };
      return response;
    } catch (err) {
      return null;
    }
  }

  /**
   * Request behavioral financial insights from Flask.
   * @param {string} userId
   * @param {number} months
   * @returns {Promise<Object>}
   */
  async getFinancialInsights(userId, months = 6) {
    const pristineFallback = {
      summary: { totalIncome: 0, totalExpense: 0, netSavings: 0, savingsRate: 0 },
      financialHealth: { score: 70, grade: "Stable", message: "Start adding transactions to unlock your AI Financial Health Score!", confidence: 0 },
      safeSpendingCapacity: { amount: 0, confidence: 0, volatilityReserve: 0, protectedSavings: 0, predictedObligations: 0, explanation: "Set up your monthly income, budgets, and savings goals to calculate your Dynamic Safe Spending Capacity." },
      budgetRisk: [],
      smartBudgets: {
        Food: { recommended: 1000, average3m: 0, message: "Recommended Food budget: ₹1,000.", confidence: 0 },
        Entertainment: { recommended: 1000, average3m: 0, message: "Recommended Entertainment budget: ₹1,000.", confidence: 0 },
        Utilities: { recommended: 1000, average3m: 0, message: "Recommended Utilities budget: ₹1,000.", confidence: 0 },
        Travel: { recommended: 1000, average3m: 0, message: "Recommended Travel budget: ₹1,000.", confidence: 0 },
        Others: { recommended: 1000, average3m: 0, message: "Recommended Others budget: ₹1,000.", confidence: 0 }
      },
      savingsForecast: { monthlySavings: 0, projectedAnnual: 0, message: "Log your monthly income to unlock savings projections.", confidence: 0 },
      recurringExpenses: [],
      anomalies: [],
      spendingTrends: [],
      personalityInsights: [],
      categoryDominance: []
    };

    try {
      const response = await this._get(`/financial-insights?userId=${userId}&months=${months}`, 8000);
      if (!response || typeof response !== "object" || response.error) {
        return pristineFallback;
      }
      return response;
    } catch (err) {
      return pristineFallback;
    }
  }

  /**
   * Trigger model retraining for a user.
   * @param {string} userId
   * @param {boolean} force - Bypass correction threshold check
   * @returns {Promise<boolean>}
   */
  async triggerTraining(userId, force = false) {
    try {
      const response = await this._post("/train", { userId, force }, 10000); // 10s timeout for training
      return response && response.success === true;
    } catch (err) {
      return false;
    }
  }

  // ─── HTTP Helpers ──────────────────────────────────────────────────

  _post(path, data, timeoutMs) {
    return this._request("POST", path, data, timeoutMs);
  }

  _get(path, timeoutMs) {
    return this._request("GET", path, null, timeoutMs);
  }

  _request(method, path, data, timeoutMs) {
    const timeout = timeoutMs || ML_CONFIG.mlTimeoutMs;
    const url = new URL(path, ML_CONFIG.mlServiceUrl);

    return new Promise((resolve) => {
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: { "Content-Type": "application/json" },
        timeout
      };

      const req = http.request(options, (res) => {
        let body = "";
        res.on("data", (chunk) => { body += chunk; });
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            if (path !== "/health") console.log("❌ [ML Bridge] Malformed JSON response received.");
            resolve(null); // Malformed JSON
          }
        });
      });

      req.on("error", (err) => {
        if (path !== "/health") console.log(`❌ [ML Bridge] HTTP request error (${path}): ${err.message}`);
        resolve(null);
      });
      req.on("timeout", () => {
        if (path !== "/health") console.log(`⏰ [ML Bridge] HTTP request timeout (${timeout}ms exceeded for ${path}). Fallback active.`);
        req.destroy();
        resolve(null);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  // ─── Health Check Polling ──────────────────────────────────────────

  _startHealthPolling() {
    // Initial check
    this._checkHealth();
    // Periodic polling
    this._healthCheckTimer = setInterval(() => {
      this._checkHealth();
    }, ML_CONFIG.healthCheckIntervalMs);

    // Don't prevent Node from exiting
    if (this._healthCheckTimer.unref) {
      this._healthCheckTimer.unref();
    }
  }

  async _checkHealth() {
    try {
      const response = await this._request("GET", "/health", null, 3000);
      this._healthy = response && response.status === "healthy";
    } catch {
      this._healthy = false;
    }
    this._lastHealthCheck = Date.now();
  }
}

module.exports = new MLBridgeService();
