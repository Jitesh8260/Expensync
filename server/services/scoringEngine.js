/**
 * scoringEngine.js
 * 
 * RESPONSIBILITY: Multi-signal weighted category scoring ONLY.
 * Accepts a feature vector from the pipeline, evaluates all signals,
 * produces a category with confidence score and an internal explanation trace.
 * 
 * Does NOT access the database. Does NOT extract data.
 * Pure scoring logic.
 */

const {
  SIGNAL_WEIGHTS,
  CATEGORY_KEYWORDS,
  KNOWN_MERCHANTS,
  INTENT_PATTERNS
} = require("./keywordKnowledgeBase");

const VALID_CATEGORIES = ["Food", "Entertainment", "Travel", "Utilities", "Income", "Others"];

class ScoringEngine {
  /**
   * Score a transaction across all categories using multi-signal weighted scoring.
   * 
   * @param {Object} featureVector - The intermediate pipeline state
   * @param {string} featureVector.normalizedText - Cleaned text
   * @param {string} featureVector.canonicalMerchant - Resolved canonical merchant
   * @param {string} featureVector.entityType - Entity classification
   * @param {string} featureVector.intent - Semantic intent
   * @param {string} featureVector.direction - 'expense' | 'income'
   * @param {boolean} featureVector.isRefund - Whether this is a refund
   * @param {boolean} featureVector.preservesMerchantCategory - Refund preserves original category
   * @param {string|null} featureVector.intentCategory - Category suggested by intent
   * @param {string|null} featureVector.adaptiveCategory - Category from user memory
   * @param {number} featureVector.adaptiveCorrectionCount - How many times user corrected
   * @returns {{ category: string, confidenceScore: number, scoringTrace: Object }}
   */
  score(featureVector) {
    const {
      normalizedText = "",
      canonicalMerchant = "",
      entityType = "unknown",
      intent = "generic_expense",
      direction = "expense",
      isRefund = false,
      preservesMerchantCategory = false,
      intentCategory = null,
      adaptiveCategory = null,
      adaptiveCorrectionCount = 0
    } = featureVector;

    const textLower = normalizedText.toLowerCase().replace(/[^\w\s]/g, " ");

    // Initialize scores and traces
    const scores = {};
    const traces = {};
    for (const cat of VALID_CATEGORIES) {
      scores[cat] = 0;
      traces[cat] = [];
    }

    // ─── Signal 1: Adaptive User Correction (highest priority) ──────
    if (adaptiveCategory && VALID_CATEGORIES.includes(adaptiveCategory)) {
      // Single correction = half weight, repeated = full weight
      const weight = adaptiveCorrectionCount >= 2
        ? SIGNAL_WEIGHTS.adaptiveMemory
        : Math.floor(SIGNAL_WEIGHTS.adaptiveMemory / 2);
      scores[adaptiveCategory] += weight;
      traces[adaptiveCategory].push(`adaptive:user_correction(${adaptiveCorrectionCount}x) +${weight}`);
    }

    // ─── Signal 2: Canonical Merchant ────────────────────────────────
    if (canonicalMerchant) {
      const merchantInfo = KNOWN_MERCHANTS[canonicalMerchant];
      if (merchantInfo && VALID_CATEGORIES.includes(merchantInfo.defaultCategory)) {
        scores[merchantInfo.defaultCategory] += SIGNAL_WEIGHTS.canonicalMerchant;
        traces[merchantInfo.defaultCategory].push(`merchant:${canonicalMerchant} +${SIGNAL_WEIGHTS.canonicalMerchant}`);
      }
    }

    // ─── Signal 3: Entity Type ───────────────────────────────────────
    const entityCategoryMap = {
      restaurant: "Food",
      transport: "Transport",
      subscription: "Entertainment",
      ecommerce: "Utilities",
      utility_provider: "Utilities",
      person: "Income"
    };
    // Correct "Transport" to "Travel" (our actual category name)
    let entityCat = entityCategoryMap[entityType];
    if (entityCat === "Transport") entityCat = "Travel";

    if (entityCat && VALID_CATEGORIES.includes(entityCat)) {
      scores[entityCat] += SIGNAL_WEIGHTS.entityType;
      traces[entityCat].push(`entity:${entityType} +${SIGNAL_WEIGHTS.entityType}`);
    }

    // ─── Signal 4: Semantic Intent ───────────────────────────────────
    if (intentCategory && VALID_CATEGORIES.includes(intentCategory)) {
      scores[intentCategory] += SIGNAL_WEIGHTS.semanticIntent;
      traces[intentCategory].push(`intent:${intent} +${SIGNAL_WEIGHTS.semanticIntent}`);
    }

    // For generic income (not refund), boost Income
    if (direction === "income" && !isRefund && !preservesMerchantCategory) {
      scores["Income"] += SIGNAL_WEIGHTS.semanticIntent;
      traces["Income"].push(`direction:income +${SIGNAL_WEIGHTS.semanticIntent}`);
    }

    // ─── Signal 5: Contextual Keywords ───────────────────────────────
    for (const [category, keywordsMap] of Object.entries(CATEGORY_KEYWORDS)) {
      if (!VALID_CATEGORIES.includes(category)) continue;
      for (const [keyword, relevance] of Object.entries(keywordsMap)) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(textLower)) {
          const weight = Math.round(relevance * (SIGNAL_WEIGHTS.contextKeyword / 5));
          if (weight > 0) {
            scores[category] += weight;
            traces[category].push(`context:${keyword} +${weight}`);
          }
        }
      }
    }

    // ─── Refund Override ─────────────────────────────────────────────
    // For refunds, suppress the Income signal if a stronger merchant category exists
    if (isRefund && preservesMerchantCategory) {
      // Find the strongest non-Income category
      let bestNonIncome = "Others";
      let bestNonIncomeScore = 0;
      for (const [cat, score] of Object.entries(scores)) {
        if (cat !== "Income" && score > bestNonIncomeScore) {
          bestNonIncomeScore = score;
          bestNonIncome = cat;
        }
      }
      if (bestNonIncomeScore > 0) {
        // Suppress Income scoring for refunds that preserve merchant category
        scores["Income"] = 0;
        traces["Income"] = [`suppressed:refund_preserves_${bestNonIncome}`];
      }
    }

    // ─── Resolve Winner ──────────────────────────────────────────────
    let bestCategory = "Others";
    let bestScore = 0;
    let secondBestScore = 0;

    for (const [category, score] of Object.entries(scores)) {
      if (score > bestScore) {
        secondBestScore = bestScore;
        bestScore = score;
        bestCategory = category;
      } else if (score > secondBestScore) {
        secondBestScore = score;
      }
    }

    // ─── Confidence Calculation ──────────────────────────────────────
    // Based on: absolute score strength, margin over runner-up, signal count
    let confidenceScore = 40; // default weak

    const margin = bestScore - secondBestScore;
    const signalCount = traces[bestCategory].length;

    if (bestScore >= 18) {
      confidenceScore = 95; // Multiple strong concordant signals
    } else if (bestScore >= 12) {
      confidenceScore = 90; // Strong primary signal (adaptive or merchant + entity)
    } else if (bestScore >= 8) {
      confidenceScore = margin >= 4 ? 85 : 75;
    } else if (bestScore >= 5) {
      confidenceScore = margin >= 3 ? 75 : 65;
    } else if (bestScore > 0) {
      confidenceScore = 55; // Weak match
    }

    // Fallback safety: if score is too weak, force Others
    if (bestScore < 4) {
      bestCategory = "Others";
      confidenceScore = 40;
    }

    // Boost confidence if multiple independent signals agree
    if (signalCount >= 3 && confidenceScore < 95) {
      confidenceScore = Math.min(95, confidenceScore + 5);
    }

    return {
      category: bestCategory,
      confidenceScore,
      scoringTrace: traces
    };
  }
}

module.exports = new ScoringEngine();
