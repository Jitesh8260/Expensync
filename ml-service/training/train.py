"""
train.py

RESPONSIBILITY: Training pipeline for KNN category classifier.
- Reads user transactions + MerchantRule corrections from MongoDB (read-only)
- Merges with bootstrap data if below threshold
- Real user data weighted 2x during training
- Controlled retraining via correction count threshold

Usage:
  CLI:  python training/train.py --user-id=<id>
  API:  Called by Flask /train endpoint
"""

import sys
import os
import json

# Add parent dir to path so imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from pymongo import MongoClient
from utils.config import MONGO_URI, MODEL_DIR, MIN_TRAINING_SAMPLES
from services.knn_classifier import knn_classifier
from services.feature_extractor import feature_extractor
from training.bootstrap_data import get_bootstrap_data


def train_user_model(user_id, force=False):
    """
    Train KNN model for a specific user.
    
    Args:
        user_id: MongoDB user ID string
        force: If True, bypass correction threshold check
    
    Returns:
        dict with training metadata or error info
    """
    # Check retraining threshold (unless forced)
    if not force:
        metadata = _load_metadata(user_id)
        if metadata:
            corrections = metadata.get("correctionsSinceLastTrain", 0)
            if corrections < 10:
                return {
                    "success": False,
                    "error": "insufficient_corrections",
                    "correctionsSinceLastTrain": corrections,
                    "threshold": 10
                }

    # Connect to MongoDB
    client = MongoClient(MONGO_URI)
    try:
        db = client.get_default_database()
    except Exception:
        db = client.get_database("financeTracker")

    # Fetch user transactions
    transactions = list(db.transactions.find(
        {"userId": _to_object_id(user_id)},
        {"title": 1, "category": 1, "merchant": 1, "source": 1}
    ))

    # Fetch merchant rules (correction history)
    merchant_rules = list(db.merchantrules.find(
        {"userId": _to_object_id(user_id)},
        {"canonicalMerchant": 1, "preferredCategory": 1, "correctionCount": 1}
    ))

    client.close()

    # Build training data from user transactions
    user_features = []
    user_labels = []

    for txn in transactions:
        title = txn.get("title", "")
        category = txn.get("category", "Others")
        merchant = txn.get("merchant", "")

        if not title or not category:
            continue

        feature_str = feature_extractor.build_feature_string(
            title, merchant, "generic_expense", "unknown"
        )
        user_features.append(feature_str)
        user_labels.append(category)

    # Add correction-weighted merchant rules
    for rule in merchant_rules:
        canonical = rule.get("canonicalMerchant", "")
        category = rule.get("preferredCategory", "")
        count = rule.get("correctionCount", 1)

        if canonical and category:
            feature_str = feature_extractor.build_feature_string(
                canonical, canonical, "generic_expense", "unknown"
            )
            # Weight corrections: add duplicates based on correction count
            for _ in range(min(count, 3)):  # Cap at 3x to avoid dominance
                user_features.append(feature_str)
                user_labels.append(category)

    # Merge with bootstrap if below threshold
    bootstrap_features, bootstrap_labels = get_bootstrap_data()

    if len(user_features) < MIN_TRAINING_SAMPLES:
        # User data weighted 2x by duplicating
        all_features = user_features * 2 + bootstrap_features
        all_labels = user_labels * 2 + bootstrap_labels
    else:
        # Enough user data — use only user data + small bootstrap supplement
        supplement_size = min(50, len(bootstrap_features))
        all_features = user_features + bootstrap_features[:supplement_size]
        all_labels = user_labels + bootstrap_labels[:supplement_size]

    # Train
    metadata = knn_classifier.train(user_id, all_features, all_labels)
    metadata["success"] = True
    metadata["userSamples"] = len(user_features)
    metadata["bootstrapSamples"] = len(all_features) - len(user_features)

    return metadata


def _load_metadata(user_id):
    """Load existing model metadata."""
    path = os.path.join(MODEL_DIR, f"{user_id}_metadata.json")
    if not os.path.exists(path):
        return None
    with open(path, "r") as f:
        return json.load(f)


def _to_object_id(user_id):
    """Convert string to ObjectId if valid."""
    from bson import ObjectId
    try:
        return ObjectId(user_id)
    except Exception:
        return user_id


# CLI support
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Train KNN model for a user")
    parser.add_argument("--user-id", required=True, help="MongoDB user ID")
    parser.add_argument("--force", action="store_true", help="Force retrain")
    args = parser.parse_args()

    result = train_user_model(args.user_id, force=args.force)
    print(json.dumps(result, indent=2))
