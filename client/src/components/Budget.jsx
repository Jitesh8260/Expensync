import { useState, useEffect, useMemo } from "react";
import Layout from "./Layout";
import { getAllTransactionsForAnalytics, fetchCategoryGoals, setCategoryGoals, getFinancialInsights } from "../api/api";
import { Info, AlertTriangle, CheckCircle, Sparkles, TrendingUp, HelpCircle, Target, ShieldCheck, ArrowUpRight, Wallet } from "lucide-react";

// Dedicated Monthly Savings Goal Subcomponent
const MonthlySavingsGoalCard = ({ monthlySavingsGoal, setMonthlySavingsGoal, totalIncome, totalExpenses, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempGoal, setTempGoal] = useState(monthlySavingsGoal);

  useEffect(() => {
    setTempGoal(monthlySavingsGoal);
  }, [monthlySavingsGoal]);

  const currentSavings = totalIncome - totalExpenses;
  const remainingNeeded = Math.max(0, monthlySavingsGoal - currentSavings);
  const progressPct = monthlySavingsGoal > 0 ? Math.min(100, (Math.max(0, currentSavings) / monthlySavingsGoal) * 100) : 0;

  const handleSaveGoal = async () => {
    const numericGoal = parseFloat(tempGoal) || 0;
    setMonthlySavingsGoal(numericGoal);
    setIsEditing(false);
    await onSave(numericGoal);
  };

  return (
    <div className="bg-gradient-to-b from-white to-slate-50/90 dark:from-[#0c0f1c] dark:to-[#1a1d2e] border border-slate-200/80 dark:border-slate-700/80 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none w-full mb-8 relative overflow-hidden transition-all">
      <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
      
      <div className="flex items-center justify-between mb-6 border-b border-emerald-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 dark:bg-emerald-500/30 rounded-2xl border border-emerald-500/30">
            <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Monthly Savings Goal</h3>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Protected Wealth Building</p>
          </div>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition shadow-sm"
          >
            Edit Target
          </button>
        ) : (
          <button
            onClick={handleSaveGoal}
            className="text-xs font-extrabold text-white bg-emerald-600 px-4 py-1.5 rounded-xl hover:bg-emerald-700 transition shadow-md"
          >
            Save Target
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="flex items-center gap-4 mb-6 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-lg font-bold text-slate-600 dark:text-slate-400">₹</span>
          <input
            type="number"
            min={0}
            value={tempGoal}
            onChange={(e) => setTempGoal(e.target.value)}
            className="w-full bg-transparent border-none focus:outline-none text-xl font-bold text-slate-800 dark:text-white"
            placeholder="Enter monthly savings goal"
            autoFocus
          />
        </div>
      ) : (
        <div className="mb-6">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Current Pacing</span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-white">
              ₹{Math.max(0, currentSavings).toLocaleString()} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/ ₹{monthlySavingsGoal.toLocaleString()}</span>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full bg-slate-200 dark:bg-slate-700/80 h-4 rounded-full overflow-hidden mb-3 shadow-inner">
            <div
              className={`h-full ${progressPct >= 100 ? "bg-emerald-500" : "bg-teal-500"} transition-all duration-700`}
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>{progressPct.toFixed(0)}% Achieved</span>
            {remainingNeeded > 0 ? (
              <span>₹{remainingNeeded.toLocaleString()} needed</span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">🎯 Target Surpassed!</span>
            )}
          </div>
        </div>
      )}

      {/* Pacing Indicator & Forecast */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md shadow-slate-200/50 dark:shadow-none flex items-start gap-3.5">
        {currentSavings >= monthlySavingsGoal && monthlySavingsGoal > 0 ? (
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5 animate-bounce" />
        ) : currentSavings > 0 ? (
          <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        )}
        <div>
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-0.5">Pacing Status</h4>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
            {currentSavings >= monthlySavingsGoal && monthlySavingsGoal > 0
              ? "🎯 Goal Achieved! Your savings are fully protected. Excellent financial discipline."
              : currentSavings > 0
              ? "⚡ At your current pace, you are on track to build a solid financial safety cushion."
              : "⚠️ Cashflow is currently negative or zero. Curb discretionary spending to get back on track."}
          </p>
        </div>
      </div>
    </div>
  );
};

// Category Budget Goals Subcomponent
const CategoryBudgetGoals = ({ goals, setGoals, mlInsights, monthlySavingsGoal, onSave }) => {
  const defaultCategories = ["Food", "Entertainment", "Utilities", "Travel", "Others"];

  const handleChange = (category, value) => {
    const amount = parseInt(value) || 0;
    setGoals({ ...goals, [category]: amount });
  };

  const handleApplySuggestion = (category, recommendedAmount) => {
    setGoals(prev => ({ ...prev, [category]: recommendedAmount }));
  };

  const handleSave = async () => {
    try {
      const categoryGoalsArray = Object.entries(goals).map(([category, goal]) => ({
        category,
        goal: parseFloat(goal)
      }));

      await setCategoryGoals(categoryGoalsArray, monthlySavingsGoal);
    } catch (err) {
      console.error(err);
    }
  };

  const totalBudget = Object.values(goals).reduce((sum, val) => sum + (parseInt(val) || 0), 0);

  return (
    <div className="bg-gradient-to-b from-white to-slate-50/90 dark:from-[#0c0f1c] dark:to-[#1a1d2e] border border-slate-200/80 dark:border-slate-700/80 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none w-full">
      <h3 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-6 tracking-tight">
        🎯 Set Category Budgets
      </h3>

      <div className="grid grid-cols-1 gap-6">
        {defaultCategories.map((category) => {
          const smartRec = mlInsights?.smartBudgets?.[category];
          return (
            <div key={category} className="flex flex-col gap-1.5 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/60 shadow-sm hover:border-indigo-500/40 transition-all">
              <div className="flex justify-between items-center">
                <label className="text-base font-bold text-slate-800 dark:text-white">{category}</label>
                {smartRec && (
                  <button
                    onClick={() => handleApplySuggestion(category, smartRec.recommended)}
                    className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 px-2.5 py-1 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition flex items-center gap-1 shadow-sm"
                    title="Click to apply recommended budget"
                  >
                    <Target size={12} /> Apply ₹{smartRec.recommended?.toLocaleString()}
                  </button>
                )}
              </div>
              <input
                type="number"
                min={0}
                value={goals[category] || 0}
                onChange={(e) => handleChange(category, e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-50 text-slate-800 dark:text-white transition-all font-semibold"
                placeholder="₹0"
              />
              {smartRec && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-0.5">
                  3m Average: ₹{smartRec.average3m?.toLocaleString()}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center text-slate-600 dark:text-slate-300 text-lg font-medium">
        🧾 Total Category Budget: <span className="font-bold text-indigo-600 dark:text-indigo-400">₹{totalBudget.toLocaleString()}</span>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all font-bold"
        >
          Save Category Goals
        </button>
      </div>
    </div>
  );
};

// Main Budget Component
const Budget = () => {
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState({});
  const [monthlySavingsGoal, setMonthlySavingsGoal] = useState(0);
  const [mlInsights, setMlInsights] = useState(null);

  const currentYear = new Date().getFullYear().toString();
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const currentMonth = months[new Date().getMonth()];

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txnsData, goalsData, insightsData] = await Promise.all([
          getAllTransactionsForAnalytics(),
          fetchCategoryGoals(),
          getFinancialInsights(6, true)
        ]);

        const txns = Array.isArray(txnsData) ? txnsData : txnsData?.transactions || [];
        setTransactions(txns);
        setMlInsights(insightsData);

        const formattedGoals = (goalsData.categoryGoals || []).reduce((acc, curr) => {
          if (curr.category !== "Savings") {
            acc[curr.category] = curr.goal;
          }
          return acc;
        }, {});
        setGoals(formattedGoals);
        setMonthlySavingsGoal(goalsData.monthlySavingsGoal || 0);
      } catch (err) {
        console.error("Failed to fetch budget data:", err);
      }
    };

    fetchData();

    window.addEventListener("expensync_data_refresh", fetchData);
    return () => window.removeEventListener("expensync_data_refresh", fetchData);
  }, []);

  const handleSaveSavingsGoal = async (newSavingsGoal) => {
    try {
      const categoryGoalsArray = Object.entries(goals).map(([category, goal]) => ({
        category,
        goal: parseFloat(goal)
      }));
      await setCategoryGoals(categoryGoalsArray, newSavingsGoal);
    } catch (err) {
      console.error(err);
    }
  };

  const availableYears = useMemo(() => {
    const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
    years.add(parseInt(currentYear));
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  // Filter transactions by month and year
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = new Date(t.date);
      const matchYear = date.getFullYear().toString() === selectedYear.toString();
      const matchMonth = months[date.getMonth()] === selectedMonth;
      return matchYear && matchMonth;
    });
  }, [transactions, selectedYear, selectedMonth]);

  const totalIncome = useMemo(() => filteredTransactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0), [filteredTransactions]);
  const totalExpenses = useMemo(() => Math.abs(filteredTransactions.filter(t => t.amount < 0).reduce((acc, t) => acc + t.amount, 0)), [filteredTransactions]);

  const budget = Object.values(goals).reduce((sum, val) => sum + (parseInt(val) || 0), 0);

  const savings = totalIncome - totalExpenses;
  const remainingBudget = budget - totalExpenses;
  const expensePercentage = budget > 0 ? Math.min((totalExpenses / budget) * 100, 100) : 0;

  return (
    <Layout>
      <div className="bg-gradient-to-b from-slate-50 to-white dark:from-[#0c0f1c] dark:to-[#1a1d2e] border border-slate-200 dark:border-slate-700 p-10 rounded-3xl shadow-xl flex flex-col md:flex-row gap-10">
        
        {/* Left Section (Budget Snapshot) */}
        <div className="w-full md:w-2/3">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-12">
            <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              💸 Budget Snapshot
            </h2>
            
            {/* Monthly Filters */}
            <div className="flex gap-4 mt-4 sm:mt-0 bg-white/50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="px-4 py-2 font-medium rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer"
                >
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                
                <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-4 py-2 font-medium rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer"
                >
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mb-10">
            {[
              { label: "Category Budget", value: budget, color: "text-slate-900 dark:text-white" },
              { label: "Income", value: totalIncome, color: "text-green-600 dark:text-green-400" },
              { label: "Expenses", value: totalExpenses, color: "text-red-500 dark:text-red-400" },
              { label: "Net Savings", value: savings, color: "text-blue-600 dark:text-blue-400" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="bg-white dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all"
              >
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium mb-2">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>₹{value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-base text-slate-600 dark:text-slate-300 mb-6">
            You've used <span className="font-semibold text-indigo-600 dark:text-indigo-400">₹{totalExpenses.toLocaleString()}</span> out of your
            <span className="font-semibold text-indigo-600 dark:text-indigo-400"> ₹{budget.toLocaleString()}</span> category budget.
          </p>

          <div className="relative w-full bg-slate-200 dark:bg-slate-700 h-4 rounded-full overflow-hidden mb-8 shadow-sm">
            <div
              className={`h-full ${remainingBudget < 0 ? "bg-red-500" : "bg-indigo-500"} transition-all duration-700`}
              style={{ width: `${expensePercentage}%` }}
            ></div>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600 dark:text-slate-300">
              {expensePercentage.toFixed(0)}%
            </span>
          </div>

          {/* Budget Guidance */}
          <div className="mt-12 bg-gradient-to-b from-white to-slate-50/90 dark:from-[#0c0f1c] dark:to-[#1a1d2e] border border-slate-200/80 dark:border-slate-700/80 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden w-full transition-all">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
            <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
              <div className="p-2.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl border border-blue-500/20">
                <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Budget Guidance</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pacing & Optimization Signals</p>
              </div>
            </div>

            {mlInsights ? (
              <div className="space-y-6">
                {/* Savings Goal Forecast */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md shadow-slate-200/50 dark:shadow-none flex items-start gap-4">
                  <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Savings Goal Forecast</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{mlInsights.savingsForecast?.message}</p>
                  </div>
                </div>

                {/* Overspending Forecast & Category Risk */}
                {mlInsights.budgetRisk?.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pacing & Overspending Forecast</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mlInsights.budgetRisk.map((risk, idx) => (
                        <div key={idx} className={`p-4 rounded-2xl border flex items-start gap-3 shadow-sm shadow-slate-200/50 dark:shadow-none ${
                          risk.riskLevel === "critical"
                            ? "bg-rose-50/90 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/50 text-rose-950 dark:text-rose-200"
                            : "bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/50 text-amber-950 dark:text-amber-200"
                        }`}>
                          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${risk.riskLevel === "critical" ? "text-rose-600 dark:text-rose-400 animate-bounce" : "text-amber-600 dark:text-amber-400"}`} />
                          <div>
                            <h5 className="text-xs font-bold uppercase tracking-wider mb-0.5">{risk.category} Risk</h5>
                            <p className="text-sm font-medium leading-relaxed">{risk.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200 flex items-center gap-3 shadow-md">
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <p className="text-sm font-semibold">All category budgets are perfectly on pace. Excellent financial discipline!</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 animate-pulse">
                <div className="h-20 bg-slate-200 dark:bg-slate-800/60 rounded-2xl"></div>
                <div className="h-20 bg-slate-200 dark:bg-slate-800/60 rounded-2xl"></div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section (Savings Goal + Category Goals) */}
        <div className="w-full md:w-1/3 mt-6 md:mt-0 flex flex-col">
          <MonthlySavingsGoalCard 
            monthlySavingsGoal={monthlySavingsGoal} 
            setMonthlySavingsGoal={setMonthlySavingsGoal} 
            totalIncome={totalIncome} 
            totalExpenses={totalExpenses} 
            onSave={handleSaveSavingsGoal}
          />
          <CategoryBudgetGoals 
            goals={goals} 
            setGoals={setGoals} 
            mlInsights={mlInsights} 
            monthlySavingsGoal={monthlySavingsGoal} 
            onSave={handleSaveSavingsGoal} 
          />
        </div>
      </div>
    </Layout>
  );
};

export default Budget;
