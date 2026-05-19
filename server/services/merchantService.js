/**
 * merchantService.js
 * 
 * RESPONSIBILITY: Merchant/entity extraction and canonical normalization ONLY.
 * Extracts merchant names from text, normalizes them to canonical identities,
 * classifies entity types, and detects P2P (person-to-person) transactions.
 * 
 * Includes an LRU-style memoization cache for normalized merchants.
 */

const {
  KNOWN_MERCHANTS,
  PERSON_NAMES,
  BUSINESS_SUFFIXES,
  BANK_NOISE_WORDS,
  PAYMENT_PREFIX_PATTERN
} = require("./keywordKnowledgeBase");

const MAX_CACHE_SIZE = 500;

class MerchantService {
  constructor() {
    // LRU-style memoization cache: raw title → { canonicalMerchant, entityType }
    this._cache = new Map();
  }

  /**
   * Extract and normalize merchant information from a raw title string.
   * 
   * @param {string} rawTitle - The raw extracted title (may contain noise)
   * @returns {{ displayTitle: string, canonicalMerchant: string, entityType: string }}
   */
  normalizeMerchant(rawTitle) {
    if (!rawTitle || rawTitle.length < 2) {
      return { displayTitle: "Smart Transaction", canonicalMerchant: "", entityType: "unknown" };
    }

    // Check cache first
    const cacheKey = rawTitle.toLowerCase().trim();
    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey);
    }

    let title = rawTitle;

    // 1. Strip payment prefixes
    title = title.replace(PAYMENT_PREFIX_PATTERN, "");

    // 2. Truncate at banking metadata (ref, utr, etc.) — safe version
    const truncateIdx = title.search(/\b(ref\b(?!und)|utr|txn|transaction id|sms freeze|available balance|avl bal|via)\b/i);
    if (truncateIdx > 0) {
      title = title.substring(0, truncateIdx);
    }

    // 3. Remove UPI handles
    title = title.replace(/@[a-zA-Z0-9.-]+/g, "");

    // 4. Remove masked accounts
    title = title.replace(/\b(a\/c)?\s*[*x]{2,}\d*\b/ig, "");

    // 5. Remove timestamps embedded in title
    title = title.replace(/\b\d{1,2}(st|nd|rd|th)?[-/\s](jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[-/\s]?\d{0,4}\b/ig, "");
    title = title.replace(/\b\d{1,2}:\d{2}(\s*(am|pm))?\b/ig, "");

    // 6. Remove standalone banking labels
    title = title.replace(/\b(credited|debited|transfer|IPPB|NEFT|IMPS|RTGS)\b/ig, "");

    // 7. Remove trailing amounts
    title = title.replace(/(?:\s*#?\s*(?:rs\.?|₹|\$)?\s*\d+(?:\.\d{1,2})?)+$/i, "");

    // 8. Remove business suffixes
    title = title.replace(BUSINESS_SUFFIXES, "");

    // 9. Structural cleanup
    title = title.replace(/[^a-zA-Z0-9\s'&]/g, " ");
    title = title.replace(/\s+/g, " ").trim();

    // 10. Check if it's a noise word
    if (BANK_NOISE_WORDS.includes(title.toLowerCase())) {
      title = "";
    }

    // Fallback
    if (title.length < 3) {
      return { displayTitle: "Smart Transaction", canonicalMerchant: "", entityType: "unknown" };
    }

    // Format display title
    const displayTitle = this._toTitleCase(title);

    // Resolve canonical merchant and entity type
    const titleLower = title.toLowerCase();

    // Check P2P first
    if (PERSON_NAMES.includes(titleLower)) {
      const result = { displayTitle, canonicalMerchant: titleLower, entityType: "person" };
      this._addToCache(cacheKey, result);
      return result;
    }

    // Check known merchants
    for (const [fragment, info] of Object.entries(KNOWN_MERCHANTS)) {
      if (titleLower.includes(fragment)) {
        const result = {
          displayTitle: this._toTitleCase(info.canonical.replace(/_/g, " ")),
          canonicalMerchant: info.canonical,
          entityType: info.entityType
        };
        this._addToCache(cacheKey, result);
        return result;
      }
    }

    // Unknown merchant — use the cleaned title as canonical
    const result = { displayTitle, canonicalMerchant: titleLower, entityType: "unknown" };
    this._addToCache(cacheKey, result);
    return result;
  }

  /**
   * Extract a raw merchant/entity name from text based on document type.
   * This does NOT normalize — call normalizeMerchant() on the result.
   * 
   * @param {string} text - Cleaned text
   * @param {string} docType - Document type
   * @param {string} direction - 'expense' | 'income'
   * @returns {string} Raw extracted merchant name
   */
  extractRawMerchant(text, docType, direction) {
    if (docType === "BANK_SMS_DEBIT" || docType === "BANK_SMS_CREDIT") {
      return this._extractFromSms(text, direction);
    } else if (docType === "PAYMENT_SCREENSHOT") {
      return this._extractFromPaymentScreenshot(text);
    } else if (docType === "RECEIPT") {
      return this._extractFromReceipt(text);
    } else {
      return this._extractFromNaturalLanguage(text);
    }
  }

  _extractFromSms(text, direction) {
    // Remove "to A/C" or "from A/C" fragments
    let searchText = text.replace(/\b(to|from)\s+a\/c.*?(?=\s|$)/gi, " ");

    if (direction === "expense") {
      const match = searchText.match(/\b(?:to|paid to|upi to)\s+([a-zA-Z0-9 '&-]+)/i);
      if (match && match[1]) return match[1].trim();
    } else {
      // Income — try "received from", "refund from", "from"
      const match = searchText.match(/\b(?:received from|refund from|from)\s+([a-zA-Z0-9 '&-]+)/i);
      if (match && match[1]) return match[1].trim();
    }

    return "";
  }

  _extractFromPaymentScreenshot(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Filter UI noise
    const noiseKeywords = [
      "share receipt", "pay again", "view history", "contact support",
      "split with friends", "check balance", "payment started", "securely paid"
    ];
    const cleanLines = lines.filter(line => !noiseKeywords.some(noise => line.toLowerCase().includes(noise)));

    for (let i = 0; i < cleanLines.length; i++) {
      const lineLower = cleanLines[i].toLowerCase();
      if (lineLower.includes("paid to") || lineLower.includes("received from") || lineLower.includes("refund from")) {
        const match = lineLower.match(/(?:paid to|received from|refund from)[\s:]*(.*)/);
        if (match && match[1] && match[1].trim().length > 0) {
          return match[1].trim();
        } else if (i + 1 < cleanLines.length) {
          return cleanLines[i + 1].trim();
        }
      }
    }

    return "";
  }

  _extractFromReceipt(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const ignoreMerchantList = /invoice|tax|receipt|bill|date|time|gst|cash|order|total|amount|welcome/i;

    // Strategy 1: Check first 5 lines for a pure text merchant name
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const candidate = lines[i];
      if (!ignoreMerchantList.test(candidate) && !/\d{2,}/.test(candidate)) {
        if (candidate.match(/^[a-zA-Z\s'&.-]{4,}$/)) {
          return candidate;
        }
      }
    }

    // Strategy 2: Scan entire text for known merchant names
    const lower = text.toLowerCase();
    for (const [fragment] of Object.entries(KNOWN_MERCHANTS)) {
      if (lower.includes(fragment)) {
        return fragment; // Return raw fragment; normalizeMerchant will clean it
      }
    }

    // Strategy 3: Try extracting first line after stripping amounts/noise
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      // Strip amounts and business suffixes from the line, then check
      let cleaned = lines[i]
        .replace(/(?:rs\.?|₹|\$)?\s*\d+(?:[,]\d{3})*(?:\.\d{1,2})?/gi, "")
        .replace(BUSINESS_SUFFIXES, "")
        .replace(/[^a-zA-Z\s'&]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (cleaned.length >= 4 && !ignoreMerchantList.test(cleaned)) {
        return cleaned;
      }
    }

    // Strategy 4: Contextual merchant inference fallback
    if (lower.includes("restaurant") || lower.includes("food") || lower.includes("menu")) return "Restaurant Order";
    if (lower.includes("bus") || lower.includes("ticket") || lower.includes("fare") || lower.includes("transport")) return "Travel Ticket";
    if (lower.includes("grocery") || lower.includes("supermarket") || lower.includes("mart")) return "Grocery Purchase";
    if (lower.includes("fuel") || lower.includes("petrol") || lower.includes("pump")) return "Fuel Payment";

    return "";
  }

  _extractFromNaturalLanguage(text) {
    const nlp = require("compromise");
    let cleanText = text;

    // Try preposition-based extraction first
    const prepMatch = cleanText.match(/\b(on|at|from|for|to|of)\s+([a-zA-Z0-9 '&]+)/i);
    if (prepMatch && prepMatch[2]) return prepMatch[2].trim();

    // Fallback to NLP noun extraction
    const doc = nlp(cleanText);
    doc.verbs().remove();
    doc.pronouns().remove();
    doc.values().remove();
    doc.match('(a|an|the)').remove();
    const nouns = doc.nouns().out("array");
    if (nouns && nouns.length > 0) {
      return nouns[0].replace(/^(on|at|for|to|of|from)\s+/i, "").trim();
    }

    return "";
  }

  /**
   * Detect context hint from text for multi-purpose merchants.
   * e.g., "Amazon Prime subscription" → "prime"
   * e.g., "Amazon recharge" → "recharge"
   * 
   * @param {string} text - Raw text
   * @param {string} canonicalMerchant - Resolved canonical merchant
   * @returns {string} Context hint or empty string
   */
  detectContextHint(text, canonicalMerchant) {
    if (!canonicalMerchant) return "";
    const lower = text.toLowerCase();

    // Context hints only apply to multi-purpose merchants
    const contextMap = {
      "amazon": ["prime", "recharge", "pay", "shopping", "kindle", "pantry", "fresh"],
      "jio": ["recharge", "fiber", "cinema", "tv"],
      "airtel": ["recharge", "xstream", "fiber"],
      "flipkart": ["plus", "pay", "shopping"]
    };

    const contexts = contextMap[canonicalMerchant];
    if (!contexts) return "";

    for (const ctx of contexts) {
      if (lower.includes(ctx)) return ctx;
    }

    return "";
  }

  // ─── Internal helpers ──────────────────────────────────────

  _toTitleCase(str) {
    return str.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
  }

  _addToCache(key, value) {
    // LRU eviction: if cache exceeds limit, remove oldest entry
    if (this._cache.size >= MAX_CACHE_SIZE) {
      const firstKey = this._cache.keys().next().value;
      this._cache.delete(firstKey);
    }
    this._cache.set(key, value);
  }
}

module.exports = new MerchantService();
