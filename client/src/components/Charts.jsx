import React, { useEffect, useState, useMemo } from "react";
import ExpenseChart from "./ExpenseChart";
import ExpenseCategoryChart from "./ExpenseCategoryChart";
import { Bar } from "react-chartjs-2";
import { motion } from "framer-motion";
import Layout from "./Layout";
import { getAllTransactionsForAnalytics, getFinancialInsights } from "../api/api";
import { Sparkles, TrendingUp, AlertTriangle, Info, Clock, Award, ShieldAlert, Zap } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Charts = () => {
    const [transactions, setTransactions] = useState([]);
    const [selectedYear, setSelectedYear] = useState("Overall");
    const [selectedMonth, setSelectedMonth] = useState("All Months");
    const [predictionsData, setPredictionsData] = useState(null);
    const [predictionsLoading, setPredictionsLoading] = useState(true);
    const [predictionsError, setPredictionsError] = useState("");
    const [activeTab, setActiveTab] = useState("trends");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getAllTransactionsForAnalytics();
                const txns = Array.isArray(data) ? data : data?.transactions || [];
                setTransactions(txns);
            } catch (err) {
                console.error("Failed to fetch transactions:", err);
            }
        };
        // Lazy fetch ML spending predictions
        const fetchPredictions = async () => {
            setPredictionsLoading(true);
            try {
                const mlRes = await getFinancialInsights(6, true);
                if (mlRes?.msg && mlRes?.predictions === null) {
                    setPredictionsError(mlRes.msg);
                } else {
                    setPredictionsData(mlRes);
                }
            } catch (err) {
                console.error("ML predictions fetch error:", err);
                setPredictionsError("ML prediction service unavailable.");
            } finally {
                setPredictionsLoading(false);
            }
        };

        const handleRefresh = () => {
            fetchData();
            fetchPredictions();
        };

        handleRefresh();

        window.addEventListener("expensync_data_refresh", handleRefresh);
        return () => window.removeEventListener("expensync_data_refresh", handleRefresh);
    }, []);

    // Extract available years
    const availableYears = useMemo(() => {
        const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
        return Array.from(years).sort((a, b) => b - a);
    }, [transactions]);

    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    // Filter transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const date = new Date(t.date);
            const matchYear = selectedYear === "Overall" || date.getFullYear().toString() === selectedYear.toString();
            const matchMonth = selectedMonth === "All Months" || months[date.getMonth()] === selectedMonth;
            return matchYear && matchMonth;
        });
    }, [transactions, selectedYear, selectedMonth]);

    // Calculate Totals for Pie & Doughnut
    const totalIncome = useMemo(() => filteredTransactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0), [filteredTransactions]);
    const totalExpense = useMemo(() => Math.abs(filteredTransactions.filter(t => t.amount < 0).reduce((acc, t) => acc + t.amount, 0)), [filteredTransactions]);

    // Bar Chart Data Processing
    const barChartData = useMemo(() => {
        if (selectedMonth === "All Months") {
            // Aggregate by Month
            const monthlyData = months.map(() => ({ income: 0, expense: 0 }));
            filteredTransactions.forEach(t => {
                const monthIdx = new Date(t.date).getMonth();
                if (t.amount > 0) monthlyData[monthIdx].income += t.amount;
                else monthlyData[monthIdx].expense += Math.abs(t.amount);
            });
            return {
                labels: months,
                datasets: [
                    { label: "Income", data: monthlyData.map(m => m.income), backgroundColor: "rgba(16, 185, 129, 0.85)", borderRadius: 4 },
                    { label: "Expenses", data: monthlyData.map(m => m.expense), backgroundColor: "rgba(244, 63, 94, 0.85)", borderRadius: 4 }
                ]
            };
        } else {
            // Aggregate by Day
            const yearForDays = selectedYear === "Overall" ? new Date().getFullYear() : parseInt(selectedYear);
            const monthIdxForDays = months.indexOf(selectedMonth);
            const daysInMonth = new Date(yearForDays, monthIdxForDays + 1, 0).getDate();
            const dailyData = Array.from({ length: daysInMonth }, () => ({ income: 0, expense: 0 }));
            
            filteredTransactions.forEach(t => {
                const date = new Date(t.date);
                const dayIdx = date.getDate() - 1;
                if (dayIdx >= 0 && dayIdx < daysInMonth) {
                    if (t.amount > 0) dailyData[dayIdx].income += t.amount;
                    else dailyData[dayIdx].expense += Math.abs(t.amount);
                }
            });

            return {
                labels: Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`),
                datasets: [
                    { label: "Income", data: dailyData.map(d => d.income), backgroundColor: "rgba(16, 185, 129, 0.85)", borderRadius: 4 },
                    { label: "Expenses", data: dailyData.map(d => d.expense), backgroundColor: "rgba(244, 63, 94, 0.85)", borderRadius: 4 }
                ]
            };
        }
    }, [filteredTransactions, selectedYear, selectedMonth]);

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: "top", labels: { color: "#64748b", font: { family: "Inter, sans-serif", size: 13, weight: '500' } } },
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: "#64748b" } },
            y: { grid: { color: "rgba(148, 163, 184, 0.1)" }, ticks: { color: "#64748b", callback: (val) => `₹${val}` } }
        }
    };

    return (
        <Layout>
            <div className="rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-[#0c0f1c] dark:to-[#1a1d2e] p-6 sm:p-10 space-y-10 w-full">
                
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1E2A45] dark:text-white">
                            Financial Dashboard
                        </h2>
                        <p className="mt-4 text-lg sm:text-xl text-slate-700 dark:text-slate-400 max-w-2xl mx-auto md:mx-0">
                            A visual glance at your income and spending patterns.
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-4 bg-white/50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="px-4 py-2 font-medium rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer"
                        >
                            <option value="Overall">Overall (All Years)</option>
                            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        
                        <select 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="px-4 py-2 font-medium rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer"
                        >
                            <option value="All Months">All Months</option>
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>

                {/* Spending Insights */}
                <div className="mt-12 bg-gradient-to-b from-white to-slate-50/90 dark:from-[#0c0f1c] dark:to-[#1a1d2e] border border-slate-200/80 dark:border-slate-700/80 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden mt-12 transition-all">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 border-b border-slate-200 dark:border-slate-700 pb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl border border-blue-500/20">
                                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Spending Insights</h3>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Behavioral Analytics & Patterns</p>
                            </div>
                        </div>

                        {/* Interactive Tabs */}
                        <div className="flex gap-2 bg-white/50 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full sm:w-auto overflow-x-auto">
                            {[
                                { id: "trends", label: "Trends", icon: <TrendingUp size={14} /> },
                                { id: "personality", label: "Personality", icon: <Clock size={14} /> },
                                { id: "dominance", label: "Dominance", icon: <Award size={14} /> },
                                { id: "discipline", label: "Discipline", icon: <ShieldAlert size={14} /> },
                                { id: "savings", label: "Savings Analytics", icon: <Award size={14} /> },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                                        activeTab === tab.id
                                            ? "bg-indigo-600 text-white shadow-md"
                                            : "text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80"
                                    }`}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {predictionsLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800/60 rounded-2xl"></div>
                            ))}
                        </div>
                    ) : predictionsError ? (
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl text-amber-800 dark:text-amber-300 text-sm flex items-center gap-2">
                            <Info className="w-5 h-5 flex-shrink-0" />
                            <span>{predictionsError}</span>
                        </div>
                    ) : predictionsData ? (
                        <div>
                            {/* Tab 1: Trends */}
                            {activeTab === "trends" && (
                                <div className="space-y-6">
                                    <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Velocity Shifts & Monthly Trends</h4>
                                    {predictionsData.spendingTrends?.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {predictionsData.spendingTrends.map((trend, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    whileHover={{ scale: 1.01 }}
                                                    className={`p-6 rounded-2xl border shadow-sm shadow-slate-200/50 dark:shadow-none flex items-start gap-4 ${
                                                        trend.trend === "increased"
                                                            ? "bg-rose-50/90 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/50 text-rose-950 dark:text-rose-200"
                                                            : "bg-emerald-50/90 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/50 text-emerald-950 dark:text-emerald-200"
                                                    }`}
                                                >
                                                    <TrendingUp className={`w-6 h-6 flex-shrink-0 mt-0.5 ${trend.trend === "increased" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`} />
                                                    <div>
                                                        <h5 className="text-sm font-bold uppercase tracking-wider mb-1">{trend.category} Spending</h5>
                                                        <p className="text-sm font-medium leading-relaxed">{trend.message}</p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-5 bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl text-slate-600 dark:text-slate-400 text-sm italic">
                                            No significant month-over-month spending trends detected yet.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab 2: Personality */}
                            {activeTab === "personality" && (
                                <div className="space-y-6">
                                    <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Behavioral Timing & Lifestyle Insights</h4>
                                    {predictionsData.personalityInsights?.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {predictionsData.personalityInsights.map((pers, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    whileHover={{ scale: 1.01 }}
                                                    className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md shadow-slate-200/50 dark:shadow-none flex items-start gap-4"
                                                >
                                                    <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <h5 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Lifestyle Timing Pattern</h5>
                                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{pers.message}</p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-5 bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl text-slate-600 dark:text-slate-400 text-sm italic">
                                            Keep adding transactions to unlock deep behavioral lifestyle and timing patterns.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab 3: Dominance */}
                            {activeTab === "dominance" && (
                                <div className="space-y-6">
                                    <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category Dominance Rankings</h4>
                                    {predictionsData.categoryDominance?.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {predictionsData.categoryDominance.map((dom, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    whileHover={{ scale: 1.02 }}
                                                    className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md shadow-slate-200/50 dark:shadow-none relative overflow-hidden group"
                                                >
                                                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-75 group-hover:opacity-100 transition-opacity"></div>
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                                                            Rank #{dom.rank}
                                                        </span>
                                                        <Award className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                                                    </div>
                                                    <div className="text-2xl font-extrabold text-slate-800 dark:text-white mb-1 tracking-tight">{dom.category}</div>
                                                    <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-3">₹{dom.amount?.toLocaleString()} ({dom.percentage}%)</div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{dom.message}</p>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-5 bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl text-slate-600 dark:text-slate-400 text-sm italic">
                                            No category dominance data available for this month.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab 4: Discipline */}
                            {activeTab === "discipline" && (
                                <div className="space-y-6">
                                    <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Financial Discipline & Risk Analysis</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Health Summary */}
                                        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md shadow-slate-200/50 dark:shadow-none flex items-start gap-4">
                                            <Zap className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h5 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Financial Health: {predictionsData.financialHealth?.grade}</h5>
                                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{predictionsData.financialHealth?.message}</p>
                                            </div>
                                        </div>

                                        {/* Overspending Alert Count */}
                                        <div className={`p-6 rounded-2xl border shadow-md shadow-slate-200/50 dark:shadow-none flex items-start gap-4 ${
                                            predictionsData.budgetRisk?.length > 0
                                                ? "bg-rose-50/90 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/50 text-rose-950 dark:text-rose-200"
                                                : "bg-emerald-50/90 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/50 text-emerald-950 dark:text-emerald-200"
                                        }`}>
                                            <ShieldAlert className={`w-6 h-6 flex-shrink-0 mt-0.5 ${predictionsData.budgetRisk?.length > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`} />
                                            <div>
                                                <h5 className="text-sm font-bold mb-1">{predictionsData.budgetRisk?.length} Active Velocity Warnings</h5>
                                                <p className="text-sm leading-relaxed">
                                                    {predictionsData.budgetRisk?.length > 0
                                                        ? "You have active budget risk alerts. Check the Budget page to optimize pacing."
                                                        : "Excellent budgeting discipline. All categories are well within safe velocity limits."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab 5: Savings Analytics */}
                            {activeTab === "savings" && (
                                <div className="space-y-6">
                                    <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Savings Goal Trend & Wealth Accumulation</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Savings Goal Trend */}
                                        <div className="p-6 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/50 shadow-md shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                                <div>
                                                    <h5 className="text-sm font-bold text-slate-800 dark:text-white mb-0.5">Savings Goal Trend</h5>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Monthly Pacing vs Protected Target</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-baseline mb-3">
                                                <span className="text-3xl font-extrabold text-slate-800 dark:text-white">
                                                    ₹{(predictionsData.summary?.netSavings || 0).toLocaleString()}
                                                </span>
                                                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                    Target: ₹{(predictionsData.safeSpendingCapacity?.protectedSavings || 0).toLocaleString()}
                                                </span>
                                            </div>
                                            {/* Progress Bar */}
                                            <div className="relative w-full bg-slate-200 dark:bg-slate-700/80 h-3 rounded-full overflow-hidden mb-4 shadow-inner">
                                                <div
                                                    className="h-full bg-emerald-500 transition-all duration-700"
                                                    style={{ width: `${predictionsData.safeSpendingCapacity?.protectedSavings > 0 ? Math.min(100, (Math.max(0, predictionsData.summary?.netSavings || 0) / predictionsData.safeSpendingCapacity?.protectedSavings) * 100) : 0}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-emerald-200 dark:border-slate-800/80 shadow-sm">
                                                {predictionsData.savingsForecast?.message}
                                            </p>
                                        </div>

                                        {/* Spending vs Savings Balance */}
                                        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md shadow-slate-200/50 dark:shadow-none flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                                    <div>
                                                        <h5 className="text-sm font-bold text-slate-800 dark:text-white mb-0.5">Spending vs Savings Balance</h5>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">Cashflow Allocation Breakdown</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 mb-6">
                                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-center shadow-sm">
                                                        <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Total Expenses</p>
                                                        <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400">₹{(predictionsData.summary?.totalExpense || 0).toLocaleString()}</p>
                                                    </div>
                                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-center shadow-sm">
                                                        <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Net Savings</p>
                                                        <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">₹{(predictionsData.summary?.netSavings || 0).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl text-blue-900 dark:text-blue-200 text-xs font-semibold flex items-center gap-2 shadow-sm">
                                                <Info className="w-4 h-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                                <span>Your current savings rate is {predictionsData.summary?.savingsRate || 0}% of your reliable income estimate.</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Main Bar Chart */}
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-tr from-white/60 to-slate-100/60 dark:from-slate-800/60 dark:to-slate-700/60 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 w-full"
                >
                    <h3 className="text-xl font-semibold text-[#1E2A45] dark:text-white mb-6">Income vs Expenses Overview</h3>
                    <div className="w-full h-[350px]">
                        {filteredTransactions.length > 0 ? (
                            <Bar data={barChartData} options={barChartOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500">No data available for selected period.</div>
                        )}
                    </div>
                </motion.div>

                {/* Pie & Doughnut Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.6 }}
                    >
                        <ExpenseChart totalIncome={totalIncome} totalExpense={totalExpense} />
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        <ExpenseCategoryChart transactions={filteredTransactions} />
                    </motion.div>
                </div>
            </div>
        </Layout>
    );
};

export default Charts;
