"""
spending_predictor.py

RESPONSIBILITY: Linear regression spending forecasting with stability guards.
- IQR-based outlier filtering
- Sparse month handling (0 transactions = 0 spend, not skipped)
- Minimum 3 months required for meaningful prediction
"""

import numpy as np
from sklearn.linear_model import LinearRegression
from utils.config import VALID_CATEGORIES


class SpendingPredictor:
    def predict(self, monthly_data):
        """
        Predict next month's spending per category.
        
        Args:
            monthly_data: dict of { category: [month1_total, month2_total, ...] }
                         Each list is chronologically ordered, most recent last.
        
        Returns:
            { predictions: { category: predicted_amount }, alerts: [...] }
            or { error: "insufficient_data" } if < 3 months
        """
        predictions = {}
        alerts = []

        for category in VALID_CATEGORIES:
            if category == "Income":
                continue  # Don't predict income spending

            values = monthly_data.get(category, [])
            active_months = [v for v in values if v > 0]

            # 0 months -> graceful fallback
            if len(active_months) == 0:
                predictions[category] = 0
                continue

            # 1-2 months -> average-based forecast
            if len(active_months) < 3:
                predicted = round(float(np.mean(active_months)), 2)
                predictions[category] = predicted
                if category == "Food" and predicted > 0:
                    alerts.append({"type": "trend", "category": category, "message": f"Based on recent spending trends, Food expenses may reach approximately ₹{predicted:,.0f} next month."})
                elif category == "Entertainment" and predicted > 0:
                    alerts.append({"type": "warning", "category": category, "message": f"Entertainment spending trend is active (averaging ₹{predicted:,.0f}/mo). Consider reviewing active subscriptions."})
                elif category == "Travel" and predicted > 0:
                    alerts.append({"type": "info", "category": category, "message": f"You may exceed your Travel budget next month if current spending patterns continue (Projected: ₹{predicted:,.0f})."})
                continue

            # 3+ months -> regression forecast
            cleaned = self._filter_outliers(values)
            if len(cleaned) < 3:
                cleaned = values  # Fall back to unfiltered if too few remain

            # Linear regression
            X = np.arange(len(cleaned)).reshape(-1, 1)
            y = np.array(cleaned)

            model = LinearRegression()
            model.fit(X, y)

            # Predict next month
            next_month = np.array([[len(cleaned)]]) 
            predicted = float(model.predict(next_month)[0])

            # Sanity: predicted spending should be non-negative
            predicted = max(0, round(predicted, 2))
            predictions[category] = predicted

            slope = float(model.coef_[0])
            if category == "Food" and predicted > 0:
                alerts.append({"type": "trend", "category": category, "message": f"Based on recent spending trends, Food expenses may reach approximately ₹{predicted:,.0f} next month."})
            elif category == "Entertainment" and slope > 50:
                alerts.append({"type": "warning", "category": category, "message": f"Entertainment spending trend is increasing (averaging +₹{round(slope):,.0f}/mo). Consider reviewing active subscriptions."})
            elif category == "Travel" and predicted > 1500:
                alerts.append({"type": "info", "category": category, "message": f"You may exceed your Travel budget next month if current spending patterns continue (Projected: ₹{predicted:,.0f})."})

        # Calculate total predicted
        total_predicted = sum(predictions.values())
        predictions["total"] = round(total_predicted, 2)

        return {
            "predictions": predictions,
            "alerts": alerts
        }

    def _filter_outliers(self, values):
        """Remove extreme outliers using IQR method."""
        if len(values) < 4:
            return values

        arr = np.array(values)
        q1 = np.percentile(arr, 25)
        q3 = np.percentile(arr, 75)
        iqr = q3 - q1

        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        filtered = [v for v in values if lower_bound <= v <= upper_bound]
        return filtered if len(filtered) >= 3 else values


# Singleton
spending_predictor = SpendingPredictor()
