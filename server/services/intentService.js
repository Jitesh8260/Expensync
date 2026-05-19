/**
 * intentService.js
 * 
 * RESPONSIBILITY: Semantic intent detection ONLY.
 * Determines the document type and semantic intent of a transaction.
 * No merchant extraction, no amount parsing, no category scoring.
 */

const { INTENT_PATTERNS } = require("./keywordKnowledgeBase");

class IntentService {
  /**
   * Detect document type from text content.
   * @param {string} text - Normalized text
   * @param {boolean} isOCR - Whether the text came from OCR
   * @returns {string} Document type enum
   */
  detectDocumentType(text, isOCR = false) {
    const lower = text.toLowerCase();

    // Receipt markers (strongest — these are structural identifiers)
    if (lower.includes("grand total") || lower.includes("net total") || lower.includes("tax invoice")) {
      return "RECEIPT";
    }

    // Payment screenshot markers
    if (lower.includes("paid to") || lower.includes("transaction id") || lower.includes("utr") || lower.includes("debited from")) {
      return "PAYMENT_SCREENSHOT";
    }

    // Bank SMS Debit markers
    if (lower.includes("debit ") || lower.includes("debited") || lower.includes("spent") || lower.includes("upi to")) {
      return "BANK_SMS_DEBIT";
    }

    // Bank SMS Credit markers
    if (lower.includes("credited") || lower.includes("salary credited") || lower.includes("received ") || lower.includes("refund")) {
      return "BANK_SMS_CREDIT";
    }

    return isOCR ? "RECEIPT" : "GENERIC_NLP_TEXT";
  }

  /**
   * Detect semantic intent from text content.
   * Intent describes WHAT the transaction is about (refund, salary, food order, etc.)
   * 
   * @param {string} text - Normalized text
   * @param {string} docType - Document type from detectDocumentType
   * @returns {{ intent: string, direction: string, isRefund: boolean, intentCategory: string|null }}
   */
  detectIntent(text, docType) {
    const lower = text.toLowerCase();

    // Check each intent pattern in priority order
    // Refund/cashback first since they override direction
    const priorityOrder = ["refund", "cashback", "salary", "subscription", "recharge", "bill_payment", "food_order", "travel_booking"];

    for (const intentName of priorityOrder) {
      const pattern = INTENT_PATTERNS[intentName];
      if (!pattern) continue;

      const matched = pattern.keywords.some(kw => lower.includes(kw));
      if (matched) {
        return {
          intent: intentName,
          direction: pattern.direction,
          isRefund: intentName === "refund" || intentName === "cashback",
          preservesMerchantCategory: pattern.preservesMerchantCategory || false,
          intentCategory: pattern.defaultCategory || null
        };
      }
    }

    // Fallback: infer direction from doc type
    let direction = "expense";
    if (docType === "BANK_SMS_CREDIT") {
      direction = "income";
    }

    // Check generic income keywords
    const incomeKeywords = ["received", "got", "earned", "won", "credited"];
    if (incomeKeywords.some(kw => lower.includes(kw))) {
      direction = "income";
    }

    return {
      intent: direction === "income" ? "generic_income" : "generic_expense",
      direction,
      isRefund: false,
      preservesMerchantCategory: false,
      intentCategory: direction === "income" ? "Income" : null
    };
  }
}

module.exports = new IntentService();
