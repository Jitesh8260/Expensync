/**
 * hybridConfidenceService.js
 * 
 * RESPONSIBILITY: Arbitration between deterministic and ML results ONLY.
 * Combines scoring signals from both engines using a trust-weighted decision matrix.
 * Produces a final category, confidence, and a debug trace explaining the decision.
 * 
 * No database access. No HTTP calls. Pure decision logic.
 */

class HybridConfidenceService {
  /**
   * Resolve the final category using both deterministic and ML signals.
   * 
   * @param {Object} deterministicResult - { category, confidenceScore }
   * @param {Object} mlResult - { category, probability, modelVersion }
   * @returns {{ category: string, confidenceScore: number, source: string, _hybridTrace: Object }}
   */
  resolve(deterministicResult, mlResult) {
    const detCat = deterministicResult.category;
    const detConf = deterministicResult.confidenceScore;
    const mlCat = mlResult.category;
    const mlProb = mlResult.probability;

    let finalCategory;
    let finalConfidence;
    let arbitrationReason;

    if (mlCat === detCat) {
      // ─── Agreement: boost confidence ───────────────────────────────
      finalCategory = detCat;
      finalConfidence = Math.min(95, detConf + 15);
      arbitrationReason = `ML agrees with deterministic (${detCat}), confidence boosted +15`;
    } else if (mlProb >= 0.7) {
      // ─── ML disagrees with high confidence: use ML ─────────────────
      finalCategory = mlCat;
      finalConfidence = Math.round(mlProb * 85);
      arbitrationReason = `ML overrides: ${mlCat}@${(mlProb * 100).toFixed(0)}% vs deterministic ${detCat}@${detConf}`;
    } else {
      // ─── ML disagrees with low confidence: keep deterministic ──────
      finalCategory = detCat;
      finalConfidence = detConf;
      arbitrationReason = `ML disagrees (${mlCat}@${(mlProb * 100).toFixed(0)}%) but too weak; keeping deterministic ${detCat}`;
    }

    return {
      category: finalCategory,
      confidenceScore: finalConfidence,
      source: "hybrid",
      _hybridTrace: {
        deterministicCategory: detCat,
        deterministicConfidence: detConf,
        mlCategory: mlCat,
        mlProbability: mlProb,
        mlModelVersion: mlResult.modelVersion || 0,
        finalDecision: finalCategory,
        arbitrationReason
      }
    };
  }
}

module.exports = new HybridConfidenceService();
