/**
 * adaptiveMemoryService.js
 * 
 * RESPONSIBILITY: User correction learning ONLY.
 * Stores and retrieves user-specific merchant→category preferences.
 * Supports contextual memory (same merchant, different context = different category).
 * Implements correction-count thresholds to guard against accidental overrides.
 * 
 * Does NOT perform any scoring or parsing.
 */

const MerchantRule = require("../models/MerchantRule");

class AdaptiveMemoryService {
  /**
   * Look up user's preferred category for a given merchant + context.
   * 
   * @param {string} userId - The authenticated user's ID
   * @param {string} canonicalMerchant - Normalized merchant identity
   * @param {string} contextHint - Optional context (e.g., "recharge", "prime")
   * @returns {Promise<{ preferredCategory: string, correctionCount: number }|null>}
   */
  async getPreference(userId, canonicalMerchant, contextHint = "") {
    if (!userId || !canonicalMerchant) return null;

    try {
      // Try context-specific rule first
      if (contextHint) {
        const contextRule = await MerchantRule.findOne({
          userId,
          canonicalMerchant,
          contextHint
        }).lean();
        if (contextRule) {
          return {
            preferredCategory: contextRule.preferredCategory,
            correctionCount: contextRule.correctionCount || 1
          };
        }
      }

      // Fallback to generic rule (no context)
      const genericRule = await MerchantRule.findOne({
        userId,
        canonicalMerchant,
        contextHint: ""
      }).lean();

      if (genericRule) {
        return {
          preferredCategory: genericRule.preferredCategory,
          correctionCount: genericRule.correctionCount || 1
        };
      }

      return null;
    } catch (err) {
      console.error("AdaptiveMemory lookup failed:", err.message);
      return null;
    }
  }

  /**
   * Record a user correction.
   * If the merchant+context combo exists, increment correctionCount.
   * Otherwise, create a new rule with correctionCount: 1.
   * 
   * @param {string} userId - The authenticated user's ID
   * @param {string} merchantName - Raw merchant name (display title)
   * @param {string} canonicalMerchant - Normalized merchant identity
   * @param {string} category - The user's chosen category
   * @param {string} contextHint - Optional context hint
   */
  async recordCorrection(userId, merchantName, canonicalMerchant, category, contextHint = "") {
    if (!userId || !canonicalMerchant || !category) return;

    try {
      const existing = await MerchantRule.findOne({
        userId,
        canonicalMerchant,
        contextHint
      });

      if (existing) {
        existing.preferredCategory = category;
        existing.correctionCount = (existing.correctionCount || 1) + 1;
        existing.merchantName = merchantName;
        existing.updatedAt = Date.now();
        await existing.save();
      } else {
        await MerchantRule.create({
          userId,
          merchantName: merchantName.toLowerCase().trim(),
          canonicalMerchant,
          preferredCategory: category,
          contextHint,
          correctionCount: 1
        });
      }
    } catch (err) {
      // Don't fail the transaction creation for adaptive memory issues
      console.error("AdaptiveMemory record failed:", err.message);
    }
  }
}

module.exports = new AdaptiveMemoryService();
