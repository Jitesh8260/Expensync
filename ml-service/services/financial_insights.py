import numpy as np
from datetime import datetime, timedelta
from collections import defaultdict
import math
import logging

logger = logging.getLogger(__name__)

class FinancialInsightsEngine:
    def __init__(self):
        # Removed "Savings" from default spending categories
        self.default_categories = ["Food", "Entertainment", "Utilities", "Travel", "Others"]

    def generate_insights(self, transactions, category_goals, merchant_rules, monthly_savings_goal=0.0, reminders=None, months=6):
        """
        Generates comprehensive behavioral financial intelligence insights.
        Ensures pristine sparse data safety, explicit confidence scoring,
        temporal datetime accuracy, explainability reasoning, and priority ranking.
        """
        now = datetime.utcnow()
        current_year = now.year
        current_month = now.month
        days_in_month = (datetime(current_year, current_month + 1, 1) - timedelta(days=1)).day if current_month < 12 else 31
        elapsed_days = max(1, now.day)
        elapsed_ratio = elapsed_days / days_in_month

        # 1. Base Structures & Parsing
        tx_count = len(transactions)
        if tx_count == 0:
            return self._get_pristine_zero_state()

        parsed_txs = []
        income_txs = []
        expense_txs = []

        current_month_expenses = defaultdict(float)
        prev_month_expenses = defaultdict(float)
        merchant_groups_6m = defaultdict(list)
        category_history_6m = defaultdict(list)
        category_history_3m = defaultdict(list)
        monthly_income_history = defaultdict(float)

        # For personality analysis (last 90 days)
        cat_time_buckets = defaultdict(lambda: defaultdict(int))
        cat_day_buckets = defaultdict(lambda: defaultdict(int))

        total_income_current = 0.0
        total_income_3m = 0.0
        total_expense_current = 0.0
        total_expense_3m = 0.0

        for tx in transactions:
            raw_date = tx.get("date")
            if isinstance(raw_date, datetime):
                dt = raw_date
            elif isinstance(raw_date, str):
                try:
                    clean_date = raw_date.replace("Z", "+00:00")
                    dt = datetime.fromisoformat(clean_date).replace(tzinfo=None)
                except Exception:
                    try:
                        dt = datetime.strptime(raw_date[:19], "%Y-%m-%dT%H:%M:%S")
                    except Exception:
                        try:
                            dt = datetime.strptime(raw_date[:10], "%Y-%m-%d")
                        except Exception:
                            dt = now
            else:
                dt = now

            amt = float(tx.get("amount", 0))
            cat = tx.get("category", "Others")
            title = tx.get("title", "").strip()
            tx_id = str(tx.get("_id", ""))

            tx_obj = {"id": tx_id, "title": title, "amount": amt, "category": cat, "date": dt}
            parsed_txs.append(tx_obj)

            is_current_month = (dt.year == current_year and dt.month == current_month)
            is_prev_month = (dt.year == current_year and dt.month == current_month - 1) or (current_month == 1 and dt.year == current_year - 1 and dt.month == 12)
            is_3m = (dt >= now - timedelta(days=90))
            is_6m = (dt >= now - timedelta(days=180))

            month_key = f"{dt.year}-{dt.month:02d}"

            if amt > 0:
                income_txs.append(tx_obj)
                monthly_income_history[month_key] += amt
                if is_current_month:
                    total_income_current += amt
                if is_3m:
                    total_income_3m += amt
            else:
                abs_amt = abs(amt)
                expense_txs.append(tx_obj)

                if is_current_month:
                    total_expense_current += abs_amt
                    current_month_expenses[cat] += abs_amt
                elif is_prev_month:
                    prev_month_expenses[cat] += abs_amt

                if is_3m:
                    total_expense_3m += abs_amt
                    category_history_3m[cat].append(abs_amt)

                    # Personality Buckets (last 90 days)
                    if dt.weekday() >= 5:
                        cat_day_buckets[cat]["Weekend"] += 1
                    else:
                        cat_day_buckets[cat]["Weekday"] += 1

                    hour = dt.hour
                    if 5 <= hour < 12:
                        cat_time_buckets[cat]["Morning (5 AM - 12 PM)"] += 1
                    elif 12 <= hour < 17:
                        cat_time_buckets[cat]["Afternoon (12 PM - 5 PM)"] += 1
                    elif 17 <= hour < 22:
                        cat_time_buckets[cat]["Evening (5 PM - 10 PM)"] += 1
                    else:
                        cat_time_buckets[cat]["Late Night (10 PM - 5 AM)"] += 1

                if is_6m:
                    category_history_6m[cat].append(abs_amt)

                    norm_merchant = title.lower()
                    for rule in merchant_rules:
                        if rule.get("merchantName", "").lower() in title.lower():
                            norm_merchant = rule.get("merchantName").title()
                            break
                    merchant_groups_6m[norm_merchant].append(tx_obj)

        # Goals mapping
        goals_map = {g.get("category"): float(g.get("goal", 0)) for g in category_goals if g.get("category") and g.get("category") != "Savings"}
        for c in self.default_categories:
            if c not in goals_map:
                goals_map[c] = 0.0

        # 2. OVERSPENDING FORECAST (Budget Risk)
        budget_risk = []
        for cat, goal in goals_map.items():
            spent = current_month_expenses.get(cat, 0.0)
            if goal <= 0:
                continue

            usage_pct = (spent / goal) * 100
            pace_ratio = (spent / goal) / elapsed_ratio
            conf = min(95, max(40, int(elapsed_ratio * 50 + min(50, len(category_history_3m[cat]) * 10))))

            if spent > goal:
                budget_risk.append({
                    "category": cat,
                    "budget": goal,
                    "spent": spent,
                    "usagePercentage": round(usage_pct, 1),
                    "elapsedMonthPercentage": round(elapsed_ratio * 100, 1),
                    "riskLevel": "critical",
                    "message": f"You have overspent your {cat} budget by ₹{round(spent - goal):,}.",
                    "confidence": conf,
                    "explanation": f"Current spending (₹{round(spent):,}) exceeds your ₹{round(goal):,} monthly budget.",
                    "priorityScore": 90
                })
            elif pace_ratio > 1.15 and spent > 0.5 * goal:
                proj_spend = spent / elapsed_ratio
                budget_risk.append({
                    "category": cat,
                    "budget": goal,
                    "spent": spent,
                    "usagePercentage": round(usage_pct, 1),
                    "elapsedMonthPercentage": round(elapsed_ratio * 100, 1),
                    "riskLevel": "high",
                    "message": f"You have used {round(usage_pct)}% of your {cat} budget with {days_in_month - elapsed_days} days remaining.",
                    "confidence": conf,
                    "explanation": f"Current spending pace (₹{round(spent):,} in {elapsed_days} days) projects to ₹{round(proj_spend):,} by month end, exceeding your ₹{round(goal):,} budget.",
                    "priorityScore": 75
                })

        # 3. SMART BUDGET RECOMMENDATION
        smart_budgets = {}
        for cat in self.default_categories:
            history = category_history_3m.get(cat, [])
            current_goal = goals_map.get(cat, 0.0)
            if len(history) >= 2:
                avg_spend = float(np.mean(history))
                recommended = round((avg_spend * 1.05) / 100) * 100
                if recommended == 0:
                    recommended = 500
                conf = min(95, max(40, len(history) * 20))
                expl = f"Calculated from your 3-month rolling average (₹{round(avg_spend):,}) plus a 5% safety buffer."
            else:
                recommended = current_goal if current_goal > 0 else 1000.0
                avg_spend = recommended
                conf = 50
                expl = f"Baseline recommendation due to sparse 3-month spending history in {cat}."

            smart_budgets[cat] = {
                "recommended": recommended,
                "average3m": round(avg_spend, 1),
                "message": f"Recommended {cat} budget: ₹{recommended:,} based on your recent spending habits.",
                "confidence": conf,
                "explanation": expl,
                "priorityScore": 60
            }

        # 4. SAVINGS GOAL FORECAST
        monthly_savings = total_income_current - total_expense_current
        if total_income_current > 0:
            projected_annual = monthly_savings * 12
            conf = min(95, max(50, int(len(income_txs) * 20)))
            if monthly_savings >= monthly_savings_goal and monthly_savings_goal > 0:
                savings_msg = f"Excellent! You are on pace to achieve your monthly savings target of ₹{round(monthly_savings_goal):,}."
                expl = f"Current net cashflow (₹{round(monthly_savings):,}) exceeds your protected monthly savings goal (₹{round(monthly_savings_goal):,})."
            elif monthly_savings > 0:
                savings_msg = f"At your current pace, you may save approximately ₹{round(projected_annual):,} this year."
                expl = f"Projected from your current monthly net cashflow (₹{round(monthly_savings):,}/month annualized)."
            else:
                savings_msg = "Your expenses are currently exceeding your income this month. Review discretionary spending."
                expl = "Monthly cashflow is currently negative. Curb discretionary velocity to restore savings."
        else:
            savings_msg = "Log your monthly income to unlock long-term savings projections."
            projected_annual = 0.0
            conf = 30
            expl = "Savings projection unavailable because no income transactions are logged for the current month."

        savings_forecast = {
            "monthlySavings": round(monthly_savings, 2),
            "projectedAnnual": round(projected_annual, 2),
            "message": savings_msg,
            "confidence": conf,
            "explanation": expl,
            "priorityScore": 65
        }

        # 5. SUBSCRIPTION / RECURRING EXPENSE DETECTION
        recurring_expenses = []
        upcoming_recurring_total = 0.0

        # Process user-defined reminders as high-confidence obligations
        reminders = reminders or []
        reminder_merchants = set()

        for r in reminders:
            title = r.get("title", "").strip()
            if not title:
                continue
            amount = float(r.get("amount", 0.0))
            category = r.get("category", "Others")
            is_rec = r.get("isRecurring", False)
            
            reminder_merchants.add(title.lower())
            upcoming_recurring_total += amount
            
            interval_days = 30 if is_rec else 0
            freq_str = "recurring monthly obligation" if is_rec else "scheduled obligation"
            
            recurring_expenses.append({
                "merchant": title,
                "category": category,
                "averageAmount": round(amount, 2),
                "estimatedIntervalDays": interval_days,
                "message": f"{title} is a user-defined {freq_str} (₹{round(amount):,}).",
                "confidence": 100, # Higher trust priority
                "explanation": f"User-defined transaction reminder acting as a high-confidence obligation.",
                "priorityScore": 95,
                "isReminder": True
            })

        for merchant, txs in merchant_groups_6m.items():
            if len(txs) < 2 or merchant.lower() in ["upi", "cash", "atm", "transfer", "others"]:
                continue

            # Avoid duplicate counting between reminder obligations and ML recurring detections
            if merchant.strip().lower() in reminder_merchants:
                continue

            txs_sorted = sorted(txs, key=lambda x: x["date"])
            intervals = [(txs_sorted[i+1]["date"] - txs_sorted[i]["date"]).days for i in range(len(txs_sorted)-1)]
            intervals = [i for i in intervals if i > 0]

            if len(intervals) >= 1:
                mean_interval = float(np.mean(intervals))
                std_interval = float(np.std(intervals)) if len(intervals) >= 2 else 0.0
                avg_amt = float(np.mean([abs(t["amount"]) for t in txs]))

                if (25 <= mean_interval <= 35 and std_interval < 5) or (6 <= mean_interval <= 8 and std_interval < 2):
                    freq = "monthly" if mean_interval > 20 else "weekly"
                    cv = (std_interval / mean_interval) if mean_interval > 0 else 0
                    conf = min(95, max(50, int(100 - (cv * 100) + (len(txs) * 5))))
                    
                    # Check upcoming unspent
                    last_dt = txs_sorted[-1]["date"]
                    next_dt = last_dt + timedelta(days=mean_interval)
                    if next_dt.year == current_year and next_dt.month == current_month and next_dt > now:
                        upcoming_recurring_total += avg_amt

                    recurring_expenses.append({
                        "merchant": merchant,
                        "category": txs[0]["category"],
                        "averageAmount": round(avg_amt, 2),
                        "estimatedIntervalDays": round(mean_interval),
                        "message": f"{merchant} appears to be a recurring {freq} subscription (avg ₹{round(avg_amt):,}).",
                        "confidence": conf,
                        "explanation": f"Detected {len(txs)} transactions at {merchant} occurring every {round(mean_interval)} days with {round(100 - cv*100)}% timing consistency.",
                        "priorityScore": 80,
                        "isReminder": False
                    })

        # 6. UNUSUAL SPENDING ALERTS (Anomalies) & RELIABLE INCOME ESTIMATION
        # A. Reliable Income Estimation (Calculated first to support Income Ratio Rule)
        active_goals_total = sum(goals_map.values())
        historical_incomes = [amt for amt in monthly_income_history.values() if amt > 0]
        
        if len(historical_incomes) >= 2:
            avg_historical_income = float(np.mean(historical_incomes))
            income_std = float(np.std(historical_incomes))
            inc_cv = income_std / avg_historical_income if avg_historical_income > 0 else 0
            inc_conf = min(95, max(50, int(100 - inc_cv * 100 + len(historical_incomes) * 10)))
        else:
            avg_historical_income = total_income_current
            inc_conf = min(80, max(40, int(len(income_txs) * 20)))

        # Fallback for incomplete income logging
        reliable_income = max(total_income_current, avg_historical_income, active_goals_total + monthly_savings_goal)

        anomalies = []
        # Check all expense transactions from the current active month (or last 30 days)
        for tx in parsed_txs:
            if tx["amount"] >= 0 or tx["date"] < now - timedelta(days=30):
                continue

            abs_amt = abs(tx["amount"])
            cat = tx.get("category", "Others")
            merchant = tx.get("title", "").strip() or cat
            tx_id = tx.get("id", "")

            # Calculate baseline excluding the current transaction being tested (leave-one-out)
            cat_hist = list(category_history_6m.get(cat, []))
            if abs_amt in cat_hist:
                cat_hist.remove(abs_amt)

            # Determine baseline mean and std dev safely
            baseline_count = len(cat_hist)
            if baseline_count > 0:
                mean_val = float(np.mean(cat_hist))
                std_val = float(np.std(cat_hist))
                cv = std_val / mean_val if mean_val > 0 else 0.0
            else:
                # Fallback baseline if no prior history in this category
                mean_val = goals_map.get(cat, 0.0) or 1000.0
                std_val = mean_val * 0.20
                cv = 0.20

            # Calculate recent monthly average for Sudden Behavioral Spike Rule
            recent_monthly_expenses = [sum(abs(t["amount"]) for t in parsed_txs if t["amount"] < 0 and t["id"] != tx_id and t["date"].year == int(m.split('-')[0]) and t["date"].month == int(m.split('-')[1])) for m in monthly_income_history.keys()]
            recent_monthly_avg = float(np.mean(recent_monthly_expenses)) if len(recent_monthly_expenses) > 0 else max(1.0, total_expense_current - abs_amt)

            # Perform Anomaly Checks (Statistical + Smart Fallbacks)
            is_anomaly = False
            reasons = []
            sources = []
            severity = "medium"
            conf = min(95, max(60, int(100 - (cv * 50) + baseline_count * 5)))

            # 1. Statistical Check (z-score / IQR threshold)
            z_score = 0.0
            iqr_range = 0.0
            if baseline_count >= 3:
                q75, q25 = np.percentile(cat_hist, [75, 25])
                iqr = q75 - q25
                iqr_range = q75 + 1.5 * iqr
                if std_val > 0:
                    z_score = (abs_amt - mean_val) / std_val

                stat_threshold = mean_val + (1.96 * std_val)
                if abs_amt > stat_threshold and abs_amt > mean_val * 1.5 and abs_amt > 2500:
                    is_anomaly = True
                    sources.append("statistical")
                    ratio = round(abs_amt / max(1.0, mean_val), 1)
                    reasons.append(f"Exceeds normal {cat} average (₹{round(mean_val):,}) by {ratio}x.")
                    if z_score > 4.0 or ratio > 5.0:
                        severity = "high"
                    if z_score > 10.0 or ratio > 10.0:
                        severity = "critical"

            # 2. Smart Fallback Rules
            # A. Hard Amount Rule (e.g. > ₹100,000)
            if abs_amt > 100000:
                is_anomaly = True
                sources.append("fallback_hard_amount")
                reasons.append(f"Extremely large transaction amount (₹{abs_amt:,}).")
                if abs_amt > 500000:
                    severity = "critical"
                elif severity != "critical":
                    severity = "high"

            # B. Category Explosion Rule (e.g. > 5x or 10x baseline mean)
            if abs_amt > mean_val * 5 and abs_amt > 2500:
                is_anomaly = True
                sources.append("fallback_category_explosion")
                ratio = round(abs_amt / max(1.0, mean_val), 1)
                reasons.append(f"Transaction is {ratio}x higher than your normal {cat} spending.")
                if abs_amt > mean_val * 10:
                    severity = "critical"
                elif severity != "critical":
                    severity = "high"

            # C. Income Ratio Rule (e.g. > 50% of reliable income)
            if reliable_income > 0 and abs_amt > reliable_income * 0.5:
                is_anomaly = True
                sources.append("fallback_income_ratio")
                inc_pct = round((abs_amt / reliable_income) * 100)
                reasons.append(f"Transaction represents {inc_pct}% of your estimated monthly income.")
                if inc_pct > 80:
                    severity = "critical"
                elif severity != "critical":
                    severity = "high"

            # D. Sudden Behavioral Spike Rule (e.g. > 5x recent monthly average)
            if recent_monthly_avg > 0 and abs_amt > recent_monthly_avg * 5 and abs_amt > 2500:
                is_anomaly = True
                sources.append("fallback_behavioral_spike")
                reasons.append("Drastic spike compared to your recent monthly spending behavior.")
                if abs_amt > recent_monthly_avg * 10:
                    severity = "critical"
                elif severity != "critical":
                    severity = "high"

            # Debug Logging (Task 2)
            decision_str = "ANOMALY" if is_anomaly else "NORMAL"
            reason_str = " | ".join(reasons) if is_anomaly else "Normal spending variance"
            logger.info(f"\n[ANOMALY CHECK]\nAmount: ₹{abs_amt}\nCategory Avg: ₹{round(mean_val, 2)}\nMonthly Avg: ₹{round(recent_monthly_avg, 2)}\nStd Dev: ₹{round(std_val, 2)}\nZ-score: {round(z_score, 2)}\nIQR Range: {round(iqr_range, 2)}\nDecision: {decision_str}\nReason: {reason_str}\n")

            if is_anomaly:
                # Deduplicate reasons and sources for internal logging/debugging
                clean_reasons = list(dict.fromkeys(reasons))
                clean_sources = list(dict.fromkeys(sources))
                combined_reason = clean_reasons[0] if len(clean_reasons) == 1 else f"{clean_reasons[0]} ({clean_reasons[1]}." if len(clean_reasons) > 1 else clean_reasons[0]
                
                # Priority score based on severity
                p_score = 95 if severity == "critical" else (85 if severity == "high" else 75)

                # Clean human-readable behavioral explanation for the premium fintech UI
                user_facing_reason = f"This transaction is significantly higher than your usual {cat} spending pattern."

                anomalies.append({
                    "transactionId": tx_id,
                    "title": merchant,
                    "merchant": merchant,
                    "amount": abs_amt,
                    "category": cat,
                    "normalAverage": round(mean_val, 2),
                    "severity": severity,
                    "reason": user_facing_reason,
                    "source": " + ".join(clean_sources),
                    "message": f"⚠ Large {cat} Expense: ₹{abs_amt:,} at {merchant}",
                    "confidence": conf,
                    "explanation": combined_reason,
                    "technicalMetadata": {
                        "sources": clean_sources,
                        "reasoningChain": combined_reason,
                        "zScore": round(z_score, 2),
                        "baselineMean": round(mean_val, 2),
                        "baselineStd": round(std_val, 2),
                        "iqrThreshold": round(iqr_range, 2)
                    },
                    "priorityScore": p_score
                })

        # 7. PREMIUM DYNAMIC SAFE SPENDING CAPACITY ENGINE
        # B. Volatility Reserve
        monthly_expenses_list = [sum(abs(t["amount"]) for t in parsed_txs if t["amount"] < 0 and t["date"].year == int(m.split('-')[0]) and t["date"].month == int(m.split('-')[1])) for m in monthly_income_history.keys()]
        if len(monthly_expenses_list) >= 2:
            exp_std = float(np.std(monthly_expenses_list))
            exp_mean = float(np.mean(monthly_expenses_list))
            exp_cv = exp_std / exp_mean if exp_mean > 0 else 0.0
            reserve_pct = min(0.20, max(0.05, exp_cv * 0.20))
        else:
            reserve_pct = 0.10 if len(anomalies) > 0 else 0.05

        volatility_reserve_amt = reliable_income * reserve_pct

        # C. Behavioral Risk Adjustment
        behavioral_penalty = len(budget_risk) * 500.0 + len(anomalies) * 250.0

        # D. Safe Spending Capacity Formula
        safe_amount = max(0.0, reliable_income - total_expense_current - upcoming_recurring_total - monthly_savings_goal - volatility_reserve_amt - behavioral_penalty)
        safe_conf = min(95, max(50, int(inc_conf * 0.5 + (1.0 - reserve_pct) * 30 + min(20, tx_count))))
        
        safe_expl = f"Calculated after reserving: ₹{round(monthly_savings_goal):,} savings goal, ₹{round(upcoming_recurring_total):,} predicted recurring obligations, ₹{round(volatility_reserve_amt):,} volatility reserve ({round(reserve_pct*100)}%), and ₹{round(behavioral_penalty):,} behavioral risk adjustment from reliable income estimate of ₹{round(reliable_income):,}."

        safe_spending_capacity = {
            "amount": round(safe_amount, 2),
            "confidence": safe_conf,
            "volatilityReserve": round(volatility_reserve_amt, 2),
            "protectedSavings": round(monthly_savings_goal, 2),
            "predictedObligations": round(upcoming_recurring_total, 2),
            "explanation": safe_expl,
            "priorityScore": 75
        }

        # 8. FINANCIAL HEALTH SCORE REBALANCING
        budget_adherence_score = 100
        if active_goals_total > 0 and total_expense_current > active_goals_total:
            over_pct = ((total_expense_current - active_goals_total) / active_goals_total) * 100
            budget_adherence_score = max(0, 100 - over_pct)

        # Reward savings goal achievement
        if monthly_savings_goal > 0:
            savings_pacing_ratio = monthly_savings / monthly_savings_goal
            savings_score = min(100, max(0, savings_pacing_ratio * 100))
        else:
            savings_rate = (monthly_savings / reliable_income * 100) if reliable_income > 0 else 0.0
            savings_score = min(100, max(0, savings_rate * 2.5))

        volatility_score = max(30, 100 - (len(anomalies) * 15))
        
        discretionary = current_month_expenses.get("Entertainment", 0) + current_month_expenses.get("Others", 0) + current_month_expenses.get("Travel", 0)
        disc_ratio = discretionary / max(1, total_expense_current)
        disc_score = max(0, 100 - (disc_ratio * 100))

        penalty = len(budget_risk) * 5
        health_score_val = (budget_adherence_score * 0.30) + (savings_score * 0.25) + (volatility_score * 0.20) + (disc_score * 0.15) + (min(95, tx_count*2) * 0.10) - penalty
        health_score_val = min(100, max(15, int(health_score_val)))
        health_conf = min(95, max(50, int(tx_count * 2)))

        if health_score_val >= 85:
            health_grade = "Excellent"
            health_msg = "Your spending variance is highly stable. Excellent budgeting & savings discipline detected."
        elif health_score_val >= 70:
            health_grade = "Stable"
            health_msg = "Your financial health is stable. Keep monitoring category budgets to hit your savings targets."
        elif health_score_val >= 50:
            health_grade = "Moderate"
            health_msg = "Moderate financial health. You have active overspending alerts that need attention."
        else:
            health_grade = "Risky"
            health_msg = "Risky spending velocity detected. Review your budgets and curb discretionary expenses."

        financial_health = {
            "score": health_score_val,
            "grade": health_grade,
            "message": health_msg,
            "confidence": health_conf,
            "explanation": f"Weighted multi-factor score: Budget Adherence ({round(budget_adherence_score)}%), Savings Target Pacing ({round(savings_score)}%), Volatility Stability ({round(volatility_score)}%), Discretionary Discipline ({round(disc_score)}%).",
            "priorityScore": 70
        }

        # 9. SPENDING TRENDS
        spending_trends = []
        for cat in self.default_categories:
            cur = current_month_expenses.get(cat, 0.0)
            prev = prev_month_expenses.get(cat, 0.0)

            if prev > 500:
                change_pct = ((cur - prev) / prev) * 100
                if abs(change_pct) > 10:
                    direction = "increased" if change_pct > 0 else "decreased"
                    conf = min(95, max(50, int(min(cur, prev) / 100)))
                    spending_trends.append({
                        "category": cat,
                        "trend": direction,
                        "percentageChange": round(abs(change_pct), 1),
                        "message": f"{cat} spending {direction} by {round(abs(change_pct))}% compared to last month.",
                        "confidence": conf,
                        "explanation": f"Compares current month velocity (₹{round(cur):,}) against previous month total (:₹{round(prev):,}).",
                        "priorityScore": 55 if direction == "increased" else 40
                    })
            elif cur > 500 and prev <= 500:
                spending_trends.append({
                    "category": cat,
                    "trend": "increased",
                    "percentageChange": 100.0,
                    "message": f"{cat} spending increased significantly this month.",
                    "confidence": min(95, max(50, int(cur / 100))),
                    "explanation": f"New active spending detected in {cat} this month (₹{round(cur):,}) with no significant activity last month.",
                    "priorityScore": 50
                })

        # 10. SPENDING PERSONALITY INSIGHTS
        personality_insights = []
        for cat in self.default_categories:
            cat_txs = category_history_3m.get(cat, [])
            cat_tx_count = len(cat_txs)

            if cat_tx_count >= 2:
                weekend_cnt = cat_day_buckets[cat]["Weekend"]
                weekend_ratio = weekend_cnt / cat_tx_count
                if weekend_ratio > 0.6:
                    conf = min(95, max(50, int(weekend_ratio * 100)))
                    personality_insights.append({
                        "type": "weekend_dominant",
                        "category": cat,
                        "message": f"Your {cat} spending is highly concentrated on weekends.",
                        "confidence": conf,
                        "explanation": f"{weekend_cnt} out of {cat_tx_count} {cat} transactions in the last 90 days occurred on weekends ({round(weekend_ratio*100)}% concentration).",
                        "priorityScore": 65
                    })

                if cat_time_buckets[cat]:
                    dominant_time = max(cat_time_buckets[cat], key=cat_time_buckets[cat].get)
                    time_cnt = cat_time_buckets[cat][dominant_time]
                    time_ratio = time_cnt / cat_tx_count
                    if time_ratio > 0.6:
                        clean_time = dominant_time[:dominant_time.find('(')].strip().lower()
                        conf = min(95, max(50, int(time_ratio * 100)))
                        personality_insights.append({
                            "type": "time_dominant",
                            "category": cat,
                            "message": f"Your {cat} spending frequently spikes during {clean_time}s.",
                            "confidence": conf,
                            "explanation": f"{time_cnt} out of {cat_tx_count} {cat} transactions in the last 90 days occurred during {clean_time}s ({round(time_ratio*100)}% concentration).",
                            "priorityScore": 65
                        })

        # 11. CATEGORY DOMINANCE
        category_dominance = []
        if total_expense_current > 0:
            sorted_cats = sorted(current_month_expenses.items(), key=lambda x: x[1], reverse=True)
            for idx, (cat, amt) in enumerate(sorted_cats):
                if amt > 0:
                    pct = (amt / total_expense_current) * 100
                    conf = min(95, max(50, int(tx_count * 2)))
                    category_dominance.append({
                        "category": cat,
                        "percentage": round(pct, 1),
                        "amount": round(amt, 2),
                        "rank": idx + 1,
                        "message": f"{cat} contributes {round(pct)}% of your monthly expenses.",
                        "confidence": conf,
                        "explanation": f"Based on current month expenditure distribution across active categories.",
                        "priorityScore": 50 - idx
                    })

        # Centralized Insight Prioritization Engine
        def _prioritize(insights_list):
            sorted_list = sorted(insights_list, key=lambda x: x.get("priorityScore", 0), reverse=True)
            for idx, item in enumerate(sorted_list):
                item["priorityRank"] = idx + 1
            return sorted_list

        return {
            "summary": {
                "totalIncome": round(total_income_current, 2),
                "totalExpense": round(total_expense_current, 2),
                "netSavings": round(monthly_savings, 2),
                "savingsRate": round(savings_rate if monthly_savings_goal == 0 else (monthly_savings/max(1, reliable_income)*100), 1)
            },
            "financialHealth": financial_health,
            "safeSpendingCapacity": safe_spending_capacity,
            "budgetRisk": _prioritize(budget_risk),
            "smartBudgets": smart_budgets,
            "savingsForecast": savings_forecast,
            "recurringExpenses": _prioritize(recurring_expenses),
            "anomalies": _prioritize(anomalies),
            "spendingTrends": _prioritize(spending_trends),
            "personalityInsights": _prioritize(personality_insights),
            "categoryDominance": _prioritize(category_dominance)
        }

    def _get_pristine_zero_state(self):
        """Returns a pristine fallback state for new users with zero transactions."""
        smart_budgets = {c: {
            "recommended": 1000.0, 
            "average3m": 0.0, 
            "message": f"Recommended {c} budget: ₹1,000.", 
            "confidence": 0,
            "explanation": "Pristine zero-state baseline recommendation.",
            "priorityScore": 0
        } for c in self.default_categories}

        return {
            "summary": {"totalIncome": 0.0, "totalExpense": 0.0, "netSavings": 0.0, "savingsRate": 0.0},
            "financialHealth": {
                "score": 70, 
                "grade": "Stable", 
                "message": "Start adding transactions to unlock your AI Financial Health Score!", 
                "confidence": 0,
                "explanation": "Pristine zero-state baseline health score.",
                "priorityScore": 0
            },
            "safeSpendingCapacity": {
                "amount": 0.0, 
                "confidence": 0,
                "volatilityReserve": 0.0,
                "protectedSavings": 0.0,
                "predictedObligations": 0.0,
                "explanation": "Set up your monthly income, budgets, and savings goals to calculate your Dynamic Safe Spending Capacity.",
                "priorityScore": 0
            },
            "budgetRisk": [],
            "smartBudgets": smart_budgets,
            "savingsForecast": {
                "monthlySavings": 0.0, 
                "projectedAnnual": 0.0, 
                "message": "Log your monthly income to unlock savings projections.", 
                "confidence": 0,
                "explanation": "Pristine zero-state baseline savings forecast.",
                "priorityScore": 0
            },
            "recurringExpenses": [],
            "anomalies": [],
            "spendingTrends": [],
            "personalityInsights": [],
            "categoryDominance": []
        }

financial_insights_engine = FinancialInsightsEngine()
