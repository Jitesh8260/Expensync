"""
app.py

Flask ML Microservice for Expensync.
4 endpoints, all with strict response schemas.

Runs on port 5050 (configurable via ML_PORT env var).
"""

import os
import sys
import time
import logging

# Configure basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

# Add project root to path
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, request, jsonify
from pymongo import MongoClient
from datetime import datetime, timedelta

from services.knn_classifier import knn_classifier
from services.spending_predictor import spending_predictor
from services.financial_insights import financial_insights_engine
from training.train import train_user_model
from utils.config import MONGO_URI, VALID_CATEGORIES

app = Flask(__name__)
START_TIME = time.time()


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "uptime": int(time.time() - START_TIME)
    })


@app.route("/predict-category", methods=["POST"])
def predict_category():
    """
    KNN category prediction.
    
    Request: { text, canonicalMerchant, entityType, intent }
    Response: { category, probability, modelVersion } or { category: null, error: ... }
    """
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"category": None, "probability": 0, "error": "invalid_request"}), 400

        text = data.get("text", "")
        canonical_merchant = data.get("canonicalMerchant", "")
        entity_type = data.get("entityType", "unknown")
        intent = data.get("intent", "generic_expense")
        user_id = data.get("userId", "")

        if not user_id:
            return jsonify({"category": None, "probability": 0, "error": "missing_userId"}), 400

        logger.info(f"📥 [Flask ML] Incoming prediction request: text='{text}', canonicalMerchant='{canonical_merchant}', entityType='{entity_type}', intent='{intent}', userId='{user_id}'")
        logger.info(f"🔍 [Flask ML] Extracted features used for prediction: '{text} {canonical_merchant} {intent} {entity_type}'.lower()")
        result = knn_classifier.predict(user_id, text, canonical_merchant, entity_type, intent)
        logger.info(f"📤 [Flask ML] Predicted category: {result.get('category')}, Probability distribution: {result.get('probabilityDistribution')}, Model version used: {result.get('modelVersion')}, Error: {result.get('error')}")

        # Validate category
        if result.get("category") and result["category"] not in VALID_CATEGORIES:
            result["category"] = None
            result["error"] = "invalid_category_predicted"

        return jsonify(result)

    except Exception as e:
        return jsonify({"category": None, "probability": 0, "error": str(e)}), 500


@app.route("/predict-spending", methods=["GET"])
def predict_spending():
    """
    Linear regression spending forecast.
    
    Query: userId, months (default 6)
    Response: { predictions: { category: amount }, alerts: [...] }
    """
    try:
        user_id = request.args.get("userId", "")
        months = int(request.args.get("months", 6))

        if not user_id:
            return jsonify({"error": "missing_userId"}), 400

        # Fetch transaction history from MongoDB
        client = MongoClient(MONGO_URI)
        try:
            db = client.get_default_database()
        except Exception:
            db = client.get_database("financeTracker")

        from bson import ObjectId
        try:
            uid = ObjectId(user_id)
        except Exception:
            uid = user_id

        # Get transactions from the last N months
        cutoff_date = datetime.utcnow() - timedelta(days=months * 30)
        transactions = list(db.transactions.find(
            {"userId": uid, "date": {"$gte": cutoff_date}, "amount": {"$lt": 0}},
            {"category": 1, "amount": 1, "date": 1}
        ))
        client.close()

        if len(transactions) == 0:
            empty_preds = {cat: 0 for cat in VALID_CATEGORIES if cat != "Income"}
            empty_preds["total"] = 0
            return jsonify({
                "predictions": empty_preds,
                "alerts": [{"type": "info", "category": "General", "message": "No recent transactions found. Start adding expenses to unlock AI spending forecasts!"}],
                "predictionSource": "fallback-zero"
            })

        # Aggregate monthly totals by category
        monthly_data = _aggregate_monthly(transactions, months)

        result = spending_predictor.predict(monthly_data)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/financial-insights", methods=["GET"])
def financial_insights():
    """
    Unified behavioral AI financial intelligence endpoint.
    
    Query: userId, months (default 6)
    Response: Shared structured JSON response schema
    """
    try:
        user_id = request.args.get("userId", "")
        months = int(request.args.get("months", 6))

        if not user_id:
            return jsonify({"error": "missing_userId"}), 400

        client = MongoClient(MONGO_URI)
        try:
            db = client.get_default_database()
        except Exception:
            db = client.get_database("financeTracker")

        from bson import ObjectId
        try:
            uid = ObjectId(user_id)
        except Exception:
            uid = user_id

        cutoff_date = datetime.utcnow() - timedelta(days=months * 30)

        # Fetch transactions, category goals, and merchant rules
        tx_query = {"$or": [{"userId": uid}, {"userId": user_id}, {"user": uid}, {"user": user_id}], "date": {"$gte": cutoff_date}}
        transactions = list(db.transactions.find(tx_query, {"category": 1, "amount": 1, "date": 1, "title": 1, "merchant": 1}))

        goals_query = {"$or": [{"userId": uid}, {"userId": user_id}, {"user": uid}, {"user": user_id}]}
        budget_doc = db.budgets.find_one(goals_query)
        
        category_goals = []
        monthly_savings_goal = 0.0

        if budget_doc:
            cat_budgets = budget_doc.get("categoryBudgets", {})
            for cat, goal in cat_budgets.items():
                category_goals.append({"category": cat, "goal": float(goal)})
            monthly_savings_goal = float(budget_doc.get("monthlySavingsGoal", 0.0))
        else:
            legacy_goals = list(db.categorybudgetgoals.find(goals_query, {"category": 1, "goal": 1}))
            for g in legacy_goals:
                if g.get("category") == "Savings":
                    monthly_savings_goal = float(g.get("goal", 0.0))
                elif g.get("category"):
                    category_goals.append({"category": g.get("category"), "goal": float(g.get("goal", 0.0))})

        rules_query = {"$or": [{"userId": uid}, {"userId": user_id}, {"user": uid}, {"user": user_id}]}
        merchant_rules = list(db.merchantrules.find(rules_query, {"merchantName": 1, "canonicalMerchant": 1, "preferredCategory": 1}))

        reminders_query = {"$or": [{"userId": uid}, {"userId": user_id}, {"user": uid}, {"user": user_id}]}
        reminders = list(db.reminders.find(reminders_query, {"title": 1, "amount": 1, "category": 1, "date": 1, "isRecurring": 1}))

        client.close()

        result = financial_insights_engine.generate_insights(
            transactions=transactions,
            category_goals=category_goals,
            merchant_rules=merchant_rules,
            monthly_savings_goal=monthly_savings_goal,
            reminders=reminders,
            months=months
        )
        return jsonify(result)

    except Exception as e:
        logger.error(f"Error in /financial-insights: {str(e)}")
        # Return pristine fallback state on error
        fallback = financial_insights_engine._get_pristine_zero_state()
        return jsonify(fallback), 200



@app.route("/train", methods=["POST"])
def train():
    """
    Trigger model retraining.
    
    Request: { userId, force (optional) }
    Response: { success, ...metadata }
    """
    try:
        data = request.get_json(silent=True)
        if not data or not data.get("userId"):
            return jsonify({"success": False, "error": "missing_userId"}), 400

        user_id = data["userId"]
        force = data.get("force", False)

        result = train_user_model(user_id, force=force)
        status_code = 200 if result.get("success") else 400
        return jsonify(result), status_code

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def _aggregate_monthly(transactions, months):
    """
    Aggregate transactions into monthly totals by category.
    Returns { category: [month1_total, month2_total, ...] }
    """
    now = datetime.utcnow()
    expense_categories = [c for c in VALID_CATEGORIES if c != "Income"]

    # Initialize monthly buckets
    monthly = {cat: [0.0] * months for cat in expense_categories}

    for txn in transactions:
        category = txn.get("category", "Others")
        if category not in expense_categories:
            continue

        amount = abs(txn.get("amount", 0))
        txn_date = txn.get("date")
        if not txn_date:
            continue

        # Calculate month index (0 = oldest, months-1 = most recent)
        month_diff = (now.year - txn_date.year) * 12 + (now.month - txn_date.month)
        index = months - 1 - month_diff

        if 0 <= index < months:
            monthly[category][index] += amount

    return monthly


if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 5050))
    print(f"🧠 ML Service starting on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
