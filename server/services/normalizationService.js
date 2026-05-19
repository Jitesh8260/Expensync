/**
 * normalizationService.js
 * 
 * RESPONSIBILITY: Text cleanup and normalization ONLY.
 * Takes raw input text (OCR, SMS, NLP) and produces a clean, normalized string.
 * No semantic understanding — just noise removal and character healing.
 */

const {
  OCR_CORRECTIONS,
  TRUNCATION_KEYWORDS,
  REF_TRUNCATION_PATTERN
} = require("./keywordKnowledgeBase");

class NormalizationService {
  /**
   * Normalize raw transaction text for downstream processing.
   * @param {string} rawText - The raw text from OCR, SMS, or user input
   * @returns {string} Cleaned, normalized text
   */
  normalize(rawText) {
    if (!rawText || typeof rawText !== "string") return "";
    let text = rawText;

    // 1. OCR Character Healing
    for (const { pattern, replacement } of OCR_CORRECTIONS) {
      text = text.replace(pattern, replacement);
    }

    // 2. Remove UPI handles (e.g., @ybl, @paytm)
    text = text.replace(/@[a-zA-Z0-9.-]+/g, " ");

    // 3. Remove masked account numbers (e.g., A/C XXXX1234, ****5678)
    text = text.replace(/\b(a\/c)?\s*[*x]{2,}\d*\b/ig, " ");

    // 4. Remove standalone timestamps (e.g., 10:30 AM, 14:22)
    text = text.replace(/\b\d{1,2}:\d{2}(:\d{2})?\s*(am|pm)?\b/ig, " ");

    // 5. Collapse excessive whitespace while preserving newlines
    text = text.replace(/[^\S\n]+/g, " ");
    text = text.replace(/\n{3,}/g, "\n\n");

    return text.trim();
  }

  /**
   * Apply safe banking text truncation.
   * Truncates text at banking metadata keywords, but PROTECTS semantic words 
   * like "Refund" that start with "ref".
   * 
   * @param {string} text - Normalized text
   * @returns {string} Truncated text (banking noise removed)
   */
  truncateBankingNoise(text) {
    if (!text) return "";
    let result = text;

    // First handle non-ambiguous truncation keywords
    for (const { text: kw, boundary } of TRUNCATION_KEYWORDS) {
      let idx;
      if (boundary) {
        const match = result.match(new RegExp(`\\b${kw}\\b`, 'i'));
        idx = match ? match.index : -1;
      } else {
        idx = result.toLowerCase().indexOf(kw.toLowerCase());
      }
      if (idx !== -1) {
        result = result.substring(0, idx);
      }
    }

    // Then handle "ref" with strict word-boundary to avoid matching "refund"
    const refMatch = result.match(REF_TRUNCATION_PATTERN);
    if (refMatch) {
      result = result.substring(0, refMatch.index);
    }

    // Remove generic SMS prefixes
    result = result.replace(/^(dear customer,?\s*)/i, "");

    return result.trim();
  }
}

module.exports = new NormalizationService();
