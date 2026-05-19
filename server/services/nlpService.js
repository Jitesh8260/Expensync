/**
 * nlpService.js
 * 
 * ORCHESTRATOR for the Contextual Adaptive Financial Intelligence Engine.
 * 
 * Delegates to specialized services in pipeline order:
 * 1. normalizationService → text cleanup
 * 2. intentService → document type + semantic intent
 * 3. merchantService → entity extraction + canonical normalization
 * 4. (this file) → amount extraction + date extraction
 * 5. scoringEngine → multi-signal category scoring
 * 6. adaptiveMemoryService → user correction bias
 * 
 * This file only owns: amount resolution, date resolution, and pipeline orchestration.
 */

const chrono = require("chrono-node");
const normalizationService = require("./normalizationService");
const intentService = require("./intentService");
const merchantService = require("./merchantService");
const scoringEngine = require("./scoringEngine");
const adaptiveMemoryService = require("./adaptiveMemoryService");
const mlBridgeService = require("./mlBridgeService");
const hybridConfidenceService = require("./hybridConfidenceService");
const { ML_CONFIG } = require("./keywordKnowledgeBase");

class NLPService {
  /**
   * Parse a natural language string and extract transaction details.
   * Multi-Stage Semantic Parsing Pipeline.
   * 
   * @param {string} text - The raw text input
   * @param {Object} options - { isOCR: boolean, userId: string }
   * @returns {Promise<Object>} Structured transaction data
   */
  async parseTransactionText(text, options = {}) {
    if (!text || typeof text !== "string") {
      throw new Error("Invalid text input for NLP parser");
    }

    const isOCR = options.isOCR || false;
    const userId = options.userId || null;

    // ─── Stage 1: Normalization ──────────────────────────────────────
    const normalizedText = normalizationService.normalize(text);

    // ─── Stage 2: Intent Detection ──────────────────────────────────
    const docType = intentService.detectDocumentType(normalizedText, isOCR);
    const intentResult = intentService.detectIntent(normalizedText, docType);

    // ─── Stage 3: Amount + Date Extraction ──────────────────────────
    // Truncated text (banking noise removed) for amount/merchant extraction
    const truncatedText = normalizationService.truncateBankingNoise(normalizedText);

    const amount = this._extractAmount(truncatedText, normalizedText, docType, intentResult);
    const date = this._extractDate(text); // Use raw text for date parsing (chrono handles it well)

    // ─── Stage 4: Merchant Extraction + Normalization ───────────────
    const rawMerchant = merchantService.extractRawMerchant(
      truncatedText, docType, intentResult.direction
    );
    const merchantInfo = merchantService.normalizeMerchant(rawMerchant);
    const contextHint = merchantService.detectContextHint(normalizedText, merchantInfo.canonicalMerchant);

    // ─── Stage 5: Adaptive Memory Lookup ────────────────────────────
    let adaptiveCategory = null;
    let adaptiveCorrectionCount = 0;

    if (userId && merchantInfo.canonicalMerchant) {
      const pref = await adaptiveMemoryService.getPreference(
        userId, merchantInfo.canonicalMerchant, contextHint
      );
      if (pref) {
        adaptiveCategory = pref.preferredCategory;
        adaptiveCorrectionCount = pref.correctionCount;
      }
    }

    // ─── Stage 5.5: P2P Direction Override ────────────────────────
    // If merchant is a person and intent was generic expense, override to income
    if (merchantInfo.entityType === "person" && intentResult.intent === "generic_expense") {
      intentResult.direction = "income";
      intentResult.intent = "person_transfer";
      intentResult.intentCategory = "Income";
    }

    // ─── Stage 6: Multi-Signal Scoring ──────────────────────────────
    const featureVector = {
      normalizedText,
      canonicalMerchant: merchantInfo.canonicalMerchant,
      entityType: merchantInfo.entityType,
      intent: intentResult.intent,
      direction: intentResult.direction,
      isRefund: intentResult.isRefund,
      preservesMerchantCategory: intentResult.preservesMerchantCategory,
      intentCategory: intentResult.intentCategory,
      adaptiveCategory,
      adaptiveCorrectionCount
    };

    const scoreResult = scoringEngine.score(featureVector);

    // ─── Stage 7.5: Hybrid ML Consultation (low-confidence recovery) ───
    let finalCategory = scoreResult.category;
    let finalConfidence = scoreResult.confidenceScore;
    let hybridTrace = null;

    if (scoreResult.confidenceScore < ML_CONFIG.mlConsultThreshold) {
      const mlResult = await mlBridgeService.predictCategory(featureVector, userId);
      if (mlResult) {
        const hybrid = hybridConfidenceService.resolve(scoreResult, mlResult);
        finalCategory = hybrid.category;
        finalConfidence = hybrid.confidenceScore;
        hybridTrace = hybrid._hybridTrace;
      }
    }

    // ─── Stage 8: Amount Sign Resolution ────────────────────────────
    let finalAmount = amount;
    if (intentResult.isRefund) {
      finalAmount = Math.abs(finalAmount);
    } else if (intentResult.direction === "expense" && finalAmount > 0) {
      finalAmount = -Math.abs(finalAmount);
    } else if (intentResult.direction === "income") {
      finalAmount = Math.abs(finalAmount);
    }

    // ─── Build Final Result ─────────────────────────────────────
    const source = (docType === "GENERIC_NLP_TEXT") ? "nlp" : (docType.includes("SMS") ? "sms" : "ocr");

    const usedMLFallback = hybridTrace !== null && finalCategory !== scoreResult.category;
    const predictionSource = hybridTrace ? "hybrid-ml" : (scoreResult.confidenceScore < ML_CONFIG.mlConsultThreshold ? "deterministic-fallback" : "deterministic");

    // ─── Structured Backend Logging ──────────────────────────────
    console.log(`\n=========== HYBRID ENGINE ===========`);
    console.log(`Input: "${text.length > 30 ? text.substring(0, 30) + '...' : text}"`);
    console.log(`Deterministic: ${scoreResult.category} (${scoreResult.confidenceScore})`);
    console.log(`Threshold: ${ML_CONFIG.mlConsultThreshold}`);
    console.log(`ML Triggered: ${scoreResult.confidenceScore < ML_CONFIG.mlConsultThreshold}`);
    if (hybridTrace) {
      console.log(`ML Prediction: ${hybridTrace.mlCategory} (${Math.round(hybridTrace.mlProbability * 100)})`);
      console.log(`Final Category: ${finalCategory} (${finalConfidence})`);
      console.log(`ML Override Applied: ${usedMLFallback}`);
    } else {
      console.log(`Final Category: ${finalCategory} (${finalConfidence})`);
      console.log(`ML Override Applied: false`);
      if (predictionSource === "deterministic-fallback") {
         console.log(`Note: ML was bypassed or offline (Fallback active)`);
      }
    }
    console.log(`=====================================\n`);

    return {
      title: merchantInfo.displayTitle,
      amount: finalAmount,
      date,
      category: finalCategory,
      confidenceScore: finalConfidence,
      source,
      
      // ML Visibility Metadata (used by frontend UI)
      predictionSource,
      predictionGeneratedAt: new Date().toISOString(),
      deterministicCategory: scoreResult.category,
      deterministicConfidence: scoreResult.confidenceScore,
      mlCategory: hybridTrace ? hybridTrace.mlCategory : null,
      mlConfidence: hybridTrace ? Math.round(hybridTrace.mlProbability * 100) : null,
      usedMLFallback,

      // Internal metadata (not displayed in UI, useful for debugging)
      _debug: {
        docType,
        intent: intentResult.intent,
        canonicalMerchant: merchantInfo.canonicalMerchant,
        entityType: merchantInfo.entityType,
        contextHint,
        scoringTrace: scoreResult.scoringTrace,
        adaptiveCategory,
        adaptiveCorrectionCount,
        hybrid: hybridTrace
      }
    };
  }

  // ─── Amount Extraction ──────────────────────────────────────────────

  /**
   * Extract the most relevant amount from text using priority-based scoring.
   * @param {string} truncatedText - Banking-noise-truncated text
   * @param {string} fullText - Full normalized text
   * @param {string} docType - Document type
   * @param {Object} intentResult - Intent detection result
   * @returns {number} Extracted amount (always positive; sign applied later)
   */
  _extractAmount(truncatedText, fullText, docType, intentResult) {
    if (docType === "RECEIPT") {
      return this._extractReceiptAmount(fullText);
    } else if (docType === "PAYMENT_SCREENSHOT") {
      return this._extractPaymentAmount(fullText);
    } else if (docType === "BANK_SMS_DEBIT" || docType === "BANK_SMS_CREDIT") {
      return this._extractSmsAmount(truncatedText);
    } else {
      return this._extractNlpAmount(truncatedText);
    }
  }

  _extractSmsAmount(text) {
    // Try currency-prefixed amounts first
    const currencyMatches = [...text.matchAll(/(?:rs\.?|inr|₹)\s*(\d+(?:[,]\d{3})*(?:\.\d{1,2})?)/gi)];
    if (currencyMatches.length > 0) {
      return parseFloat(currencyMatches[0][1].replace(/,/g, ""));
    }

    // Fallback to bare numbers (skip very small numbers that might be noise)
    const bareMatch = text.match(/\b(\d{2,}(?:\.\d{1,2})?)\b/);
    if (bareMatch) {
      const val = parseFloat(bareMatch[1]);
      if (val > 0 && !(val >= 1900 && val <= 2100)) return val;
    }

    return 0;
  }

  _extractPaymentAmount(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const candidates = [];

    for (const line of lines) {
      // Skip tax/quantity lines and long numbers (UTR IDs)
      if (/tax|gst|qty|quantity/i.test(line)) continue;
      if (/\b\d{10,}\b/.test(line)) continue;

      const matches = [...line.matchAll(/(?:rs\.?|₹|\$)?\s*(\d+(?:[,]\d{3})*(?:\.\d{1,2})?)/gi)];
      for (const match of matches) {
        const val = parseFloat(match[1].replace(/,/g, ""));
        if (val === 0) continue;

        let score = 10;
        if (line.includes("₹") || /\brs\.?\b/i.test(line) || line.includes("$")) score = 50;
        if (/paid|received|refund|amount/i.test(line)) score += 20;
        if (val >= 1900 && val <= 2100 && !match[0].includes(".")) score -= 10;

        candidates.push({ amount: val, score });
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates.length > 0 ? candidates[0].amount : 0;
  }

  _extractReceiptAmount(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const candidates = [];

    for (let line of lines) {
      let lineLower = line.toLowerCase();

      // Skip irrelevant numeric lines
      if (/qty|quantity|tax|gst|items/i.test(lineLower)) continue;

      // OCR digit healing on amount-relevant lines
      if (/total|amount|paid|fare|net/i.test(lineLower)) {
        line = line.split(/\s+/).map(token => {
          if (/\d/.test(token)) {
            return token.replace(/[Oo]/g, "0").replace(/[lI]/g, "1")
                       .replace(/[Zz]/g, "7").replace(/[Ss]/g, "5").replace(/[Bb]/g, "8");
          }
          return token;
        }).join(" ");
        lineLower = line.toLowerCase();
      }

      const matches = [...line.matchAll(/(?:rs\.?|₹|\$)?\s*(\d+(?:[,]\d{3})*(?:\.\d{1,2})?)/gi)];
      if (!matches || matches.length === 0) continue;

      let score = 0;
      if (/grand total|total payable|final amount/i.test(lineLower)) score = 100;
      else if (/paid amt|amount paid|refund/i.test(lineLower)) score = 95;
      else if (/\bpaid\b/i.test(lineLower)) score = 90;
      else if (/fare|ticket/i.test(lineLower)) score = 85;
      else if (/net total|net amount/i.test(lineLower)) score = 80;
      else if (/\bnet\b/i.test(lineLower)) score = 75;
      else if (/\btotal\b/i.test(lineLower)) score = 60;
      else if (/subtotal|sub total/i.test(lineLower)) score = 40;
      else if (/(?:₹|\$|rs\.?)\s*\d+/i.test(line)) score = 20;
      else if (/\b\d+\.\d{2}\b/.test(line)) score = 10;

      // Skip multiplication patterns (item × qty)
      if ((score === 0 || score === 10) && /\d+\s*[x*]\s*\d+/i.test(lineLower)) continue;

      if (score > 0) {
        let bestAmount = 0;
        for (const match of matches) {
          const val = parseFloat(match[1].replace(/,/g, ""));
          if (val >= 1900 && val <= 2100 && !match[0].includes(".")) continue;
          if (val === 0) continue;
          if (val > bestAmount) bestAmount = val;
        }
        if (bestAmount > 0) candidates.push({ amount: bestAmount, score });
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates.length > 0 ? candidates[0].amount : 0;
  }

  _extractNlpAmount(text) {
    // Try currency-prefixed first
    const currencyMatch = text.match(/(?:rs\.?|₹|\$)\s*(\d+(?:[,]\d{3})*(?:\.\d{1,2})?)/i);
    if (currencyMatch) return parseFloat(currencyMatch[1].replace(/,/g, ""));

    // Fallback to bare number
    const bareMatch = text.match(/\b(\d+(?:\.\d{1,2})?)\b/);
    if (bareMatch) {
      const val = parseFloat(bareMatch[1]);
      if (val > 0 && !(val >= 1900 && val <= 2100)) return val;
    }

    return 0;
  }

  // ─── Date Extraction ────────────────────────────────────────────────

  _extractDate(text) {
    const results = chrono.parse(text);
    let date = new Date();
    if (results && results.length > 0) {
      date = results[0].start.date();
    }
    return date.toISOString().split("T")[0];
  }
}

module.exports = new NLPService();
