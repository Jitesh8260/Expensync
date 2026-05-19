/**
 * keywordKnowledgeBase.js
 * 
 * Centralized semantic knowledge store for the financial intelligence engine.
 * Single source of truth for all keyword dictionaries, merchant mappings,
 * intent patterns, entity type classifications, and scoring weights.
 * 
 * IMPORTANT: This is a pure data module with no side effects.
 * All services import from here rather than maintaining their own copies.
 */

// ─── Configurable Signal Weights ─────────────────────────────────────────────
// Priority order: adaptive > merchant > entity > intent > context > OCR
const SIGNAL_WEIGHTS = {
  adaptiveMemory: 12,
  canonicalMerchant: 10,
  entityType: 8,
  semanticIntent: 6,
  contextKeyword: 4,
  ocrContext: 2
};

// ─── ML Integration Configuration ───────────────────────────────────────────
// Centralized thresholds for hybrid deterministic + ML system.
const ML_CONFIG = {
  mlConsultThreshold: 70,        // Below this → consult ML service
  highConfidenceThreshold: 85,   // Above this → never consult ML
  fallbackThreshold: 50,         // Below this → ML gets stronger voice
  mlServiceUrl: process.env.ML_SERVICE_URL || "http://127.0.0.1:5050",
  mlTimeoutMs: 2000,             // Hard timeout for ML prediction calls
  retrainCorrectionThreshold: 10, // Retrain after N new corrections
  minTrainingSamples: 30,        // Min transactions for personalized model
  healthCheckIntervalMs: 30000   // Health poll frequency (30s)
};

// ─── Category Keyword Dictionaries ──────────────────────────────────────────
// Each keyword has a base relevance weight (1-5).
// The scoringEngine multiplies this by the signal weight above.
const CATEGORY_KEYWORDS = {
  Food: {
    "restaurant": 5, "biryani": 5, "pizza": 5, "burger": 5, "cafe": 4,
    "zomato": 5, "swiggy": 5, "dine": 4, "take away": 4, "meal": 4,
    "dominos": 5, "kfc": 5, "mcdonalds": 5, "food": 4, "chicken": 3,
    "bakery": 4, "dhaba": 4, "canteen": 4, "mess": 3, "tiffin": 4,
    "thali": 4, "noodles": 3, "chai": 3, "coffee": 3, "starbucks": 5,
    "subway": 5, "haldirams": 5, "barbeque": 4
  },
  Entertainment: {
    "movie": 5, "netflix": 5, "spotify": 5, "steam": 5, "game": 4,
    "cinema": 5, "youtube": 5, "primevideo": 5, "hotstar": 5,
    "subscription": 3, "disney": 5, "jiocinema": 5, "prime": 4,
    "theatre": 4, "concert": 4, "event": 3, "bookmyshow": 5,
    "zee5": 5, "sonyliv": 5, "crunchyroll": 5, "gaming": 4
  },
  Travel: {
    "transport": 5, "ticket": 4, "fare": 4, "travelled km": 5,
    "metro": 5, "bus": 5, "uber": 5, "ola": 5, "rapido": 5,
    "train": 5, "fuel": 5, "petrol": 5, "diesel": 5, "irctc": 5,
    "makemytrip": 5, "route": 4, "platform": 4, "mobus": 5,
    "capital region": 5, "flight": 5, "airport": 5, "cab": 5,
    "auto": 4, "rickshaw": 4, "toll": 5, "parking": 4,
    "indigo": 5, "spicejet": 5, "vistara": 5, "redbus": 5,
    "yatra": 5, "goibibo": 5, "cleartrip": 5
  },
  Utilities: {
    "electricity": 5, "wifi": 5, "internet": 5, "recharge": 5,
    "water": 5, "broadband": 5, "jio": 5, "airtel": 5, "bsnl": 5,
    "amazon": 5, "flipkart": 5, "myntra": 5, "shopping": 5,
    "emi": 5, "loan": 5, "credit card": 5, "rent": 5, "hostel": 5,
    "pharmacy": 5, "hospital": 5, "store": 2, "mart": 2, "bill": 3,
    "insurance": 5, "medical": 4, "doctor": 4, "grocery": 4,
    "gas": 4, "cylinder": 4, "maintenance": 4, "society": 3,
    "tuition": 4, "school": 3, "college": 3, "fees": 4,
    "meesho": 5, "ajio": 5, "nykaa": 5, "snapdeal": 5,
    "reliance": 4, "dmart": 5, "bigbasket": 5, "zepto": 5,
    "blinkit": 5, "instamart": 5
  },
  Income: {
    "salary": 5, "credited": 4, "cashback": 4, "freelance": 5,
    "payment received": 5, "stipend": 5, "bonus": 5, "dividend": 5,
    "interest": 4, "prize": 4, "won": 4
  }
};

// ─── Known Merchant Canonical Map ───────────────────────────────────────────
// Maps merchant name variations to a single canonical identity.
// The key is a lowercase fragment; if a merchant title contains this fragment,
// it resolves to the canonical name.
const KNOWN_MERCHANTS = {
  // Food
  "zomato": { canonical: "zomato", entityType: "restaurant", defaultCategory: "Food" },
  "swiggy": { canonical: "swiggy", entityType: "restaurant", defaultCategory: "Food" },
  "dominos": { canonical: "dominos", entityType: "restaurant", defaultCategory: "Food" },
  "domino's": { canonical: "dominos", entityType: "restaurant", defaultCategory: "Food" },
  "kfc": { canonical: "kfc", entityType: "restaurant", defaultCategory: "Food" },
  "mcdonalds": { canonical: "mcdonalds", entityType: "restaurant", defaultCategory: "Food" },
  "mcdonald": { canonical: "mcdonalds", entityType: "restaurant", defaultCategory: "Food" },
  "starbucks": { canonical: "starbucks", entityType: "restaurant", defaultCategory: "Food" },
  "subway": { canonical: "subway", entityType: "restaurant", defaultCategory: "Food" },
  "haldirams": { canonical: "haldirams", entityType: "restaurant", defaultCategory: "Food" },
  "pizza hut": { canonical: "pizza_hut", entityType: "restaurant", defaultCategory: "Food" },
  "burger king": { canonical: "burger_king", entityType: "restaurant", defaultCategory: "Food" },

  // Travel
  "uber": { canonical: "uber", entityType: "transport", defaultCategory: "Travel" },
  "ola": { canonical: "ola", entityType: "transport", defaultCategory: "Travel" },
  "rapido": { canonical: "rapido", entityType: "transport", defaultCategory: "Travel" },
  "irctc": { canonical: "irctc", entityType: "transport", defaultCategory: "Travel" },
  "makemytrip": { canonical: "makemytrip", entityType: "transport", defaultCategory: "Travel" },
  "redbus": { canonical: "redbus", entityType: "transport", defaultCategory: "Travel" },
  "indigo": { canonical: "indigo", entityType: "transport", defaultCategory: "Travel" },
  "spicejet": { canonical: "spicejet", entityType: "transport", defaultCategory: "Travel" },
  "vistara": { canonical: "vistara", entityType: "transport", defaultCategory: "Travel" },
  "goibibo": { canonical: "goibibo", entityType: "transport", defaultCategory: "Travel" },
  "cleartrip": { canonical: "cleartrip", entityType: "transport", defaultCategory: "Travel" },
  "yatra": { canonical: "yatra", entityType: "transport", defaultCategory: "Travel" },
  "mobus": { canonical: "mobus", entityType: "transport", defaultCategory: "Travel" },
  "capital region urban transport": { canonical: "crut", entityType: "transport", defaultCategory: "Travel" },

  // Entertainment
  "netflix": { canonical: "netflix", entityType: "subscription", defaultCategory: "Entertainment" },
  "spotify": { canonical: "spotify", entityType: "subscription", defaultCategory: "Entertainment" },
  "hotstar": { canonical: "hotstar", entityType: "subscription", defaultCategory: "Entertainment" },
  "disney": { canonical: "disney_hotstar", entityType: "subscription", defaultCategory: "Entertainment" },
  "primevideo": { canonical: "prime_video", entityType: "subscription", defaultCategory: "Entertainment" },
  "prime video": { canonical: "prime_video", entityType: "subscription", defaultCategory: "Entertainment" },
  "bookmyshow": { canonical: "bookmyshow", entityType: "subscription", defaultCategory: "Entertainment" },
  "youtube": { canonical: "youtube", entityType: "subscription", defaultCategory: "Entertainment" },
  "jiocinema": { canonical: "jiocinema", entityType: "subscription", defaultCategory: "Entertainment" },
  "zee5": { canonical: "zee5", entityType: "subscription", defaultCategory: "Entertainment" },
  "steam": { canonical: "steam", entityType: "subscription", defaultCategory: "Entertainment" },

  // Utilities / E-commerce (multi-purpose — context-dependent)
  "amazon": { canonical: "amazon", entityType: "ecommerce", defaultCategory: "Utilities" },
  "flipkart": { canonical: "flipkart", entityType: "ecommerce", defaultCategory: "Utilities" },
  "myntra": { canonical: "myntra", entityType: "ecommerce", defaultCategory: "Utilities" },
  "meesho": { canonical: "meesho", entityType: "ecommerce", defaultCategory: "Utilities" },
  "ajio": { canonical: "ajio", entityType: "ecommerce", defaultCategory: "Utilities" },
  "nykaa": { canonical: "nykaa", entityType: "ecommerce", defaultCategory: "Utilities" },
  "bigbasket": { canonical: "bigbasket", entityType: "ecommerce", defaultCategory: "Utilities" },
  "zepto": { canonical: "zepto", entityType: "ecommerce", defaultCategory: "Utilities" },
  "blinkit": { canonical: "blinkit", entityType: "ecommerce", defaultCategory: "Utilities" },
  "dmart": { canonical: "dmart", entityType: "ecommerce", defaultCategory: "Utilities" },

  // Telecom / Utility Providers
  "jio": { canonical: "jio", entityType: "utility_provider", defaultCategory: "Utilities" },
  "airtel": { canonical: "airtel", entityType: "utility_provider", defaultCategory: "Utilities" },
  "bsnl": { canonical: "bsnl", entityType: "utility_provider", defaultCategory: "Utilities" },
  "vodafone": { canonical: "vodafone", entityType: "utility_provider", defaultCategory: "Utilities" },
  "vi ": { canonical: "vodafone", entityType: "utility_provider", defaultCategory: "Utilities" }
};

// ─── Intent Patterns ────────────────────────────────────────────────────────
// Each intent maps to detection keywords and default category influence.
const INTENT_PATTERNS = {
  refund: {
    keywords: ["refund", "refunded", "reversal", "reversed", "chargeback"],
    direction: "income",
    preservesMerchantCategory: true
  },
  salary: {
    keywords: ["salary", "payroll", "wages"],
    direction: "income",
    defaultCategory: "Income"
  },
  person_transfer: {
    keywords: [], // detected by entity type, not keywords
    direction: "income",
    defaultCategory: "Income"
  },
  bill_payment: {
    keywords: ["bill", "bill payment", "autopay"],
    direction: "expense",
    defaultCategory: "Utilities"
  },
  recharge: {
    keywords: ["recharge", "top up", "topup", "prepaid"],
    direction: "expense",
    defaultCategory: "Utilities"
  },
  subscription: {
    keywords: ["subscription", "monthly plan", "annual plan", "premium", "membership"],
    direction: "expense",
    defaultCategory: "Entertainment"
  },
  food_order: {
    keywords: ["food order", "delivery", "takeaway", "take away", "dine in"],
    direction: "expense",
    defaultCategory: "Food"
  },
  travel_booking: {
    keywords: ["booking", "ticket", "fare", "ride", "trip", "journey", "travelled"],
    direction: "expense",
    defaultCategory: "Travel"
  },
  cashback: {
    keywords: ["cashback", "cash back", "reward"],
    direction: "income",
    preservesMerchantCategory: true
  }
};

// ─── P2P Person Heuristics ──────────────────────────────────────────────────
const PERSON_NAMES = [
  "papa", "mom", "dad", "bro", "sis", "friend", "roommate",
  "mother", "father", "brother", "sister", "uncle", "aunt",
  "cousin", "wife", "husband", "gf", "bf"
];

// ─── OCR Correction Patterns ────────────────────────────────────────────────
const OCR_CORRECTIONS = [
  { pattern: /travell?[ae]d\s*km/gi, replacement: "travelled km" },
  { pattern: /am[ou]*nt\s*pa[li]d/gi, replacement: "amount paid" },
  { pattern: /txn\s*id|transaction\s*id/gi, replacement: "" },
  { pattern: /g[sr]and\s*tot[ae]l/gi, replacement: "grand total" },
  { pattern: /ne[lt]\s*tot[ae]l/gi, replacement: "net total" }
];

// ─── Banking Truncation Keywords ────────────────────────────────────────────
// Text after these keywords is usually noise (reference IDs, balance info).
// IMPORTANT: "ref" must use word-boundary matching to avoid destroying "Refund".
const TRUNCATION_KEYWORDS = [
  { text: "utr", boundary: true },
  { text: "avl bal", boundary: false },
  { text: "available bal", boundary: false },
  { text: "if not you", boundary: false },
  { text: "sms freeze", boundary: false },
  { text: "transaction id", boundary: false },
  { text: "txn id", boundary: false }
];

// Separate from truncation: "ref" requires strict word-boundary to avoid matching "refund"
const REF_TRUNCATION_PATTERN = /\bref\b(?!und)/i;

// ─── Business Suffix Patterns ───────────────────────────────────────────────
const BUSINESS_SUFFIXES = /\b(limited|ltd|pvt|private|technologies|solutions|enterprises|seller services|services|india|bv|corporation|corp|inc)\b/gi;

// ─── Bank Noise Words ───────────────────────────────────────────────────────
const BANK_NOISE_WORDS = ["a/c", "debit", "credit", "upi", "rs", "inr", "neft", "imps", "rtgs"];

// ─── Payment Prefixes ───────────────────────────────────────────────────────
const PAYMENT_PREFIX_PATTERN = /^(upi to|paid to|received from|sent to|debited from|credited to|refund from|refund of|transfer to|transfer from)\s+/i;

module.exports = {
  SIGNAL_WEIGHTS,
  ML_CONFIG,
  CATEGORY_KEYWORDS,
  KNOWN_MERCHANTS,
  INTENT_PATTERNS,
  PERSON_NAMES,
  OCR_CORRECTIONS,
  TRUNCATION_KEYWORDS,
  REF_TRUNCATION_PATTERN,
  BUSINESS_SUFFIXES,
  BANK_NOISE_WORDS,
  PAYMENT_PREFIX_PATTERN
};
