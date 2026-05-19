const mongoose = require('mongoose');

const MerchantRuleSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  merchantName: { 
    type: String, 
    required: true 
  },
  canonicalMerchant: {
    type: String,
    required: true
  },
  preferredCategory: { 
    type: String, 
    required: true 
  },
  contextHint: {
    type: String,
    default: ""
  },
  correctionCount: {
    type: Number,
    default: 1
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Compound index: one rule per user per canonical merchant per context
MerchantRuleSchema.index({ userId: 1, canonicalMerchant: 1, contextHint: 1 }, { unique: true });

module.exports = mongoose.model('MerchantRule', MerchantRuleSchema);
