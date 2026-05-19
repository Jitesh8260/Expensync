import { jwtDecode } from "jwt-decode";
import { useEffect, useState, useMemo } from "react";
import {
    ArrowDownRight,
    ArrowUpRight,
    Wallet,
    Plus,
    Sparkles,
    AlertTriangle,
    ShieldCheck,
    Activity,
    HelpCircle,
} from "lucide-react";
import AddTransaction from "./AddTransaction";
import ExpenseChart from "./ExpenseChart";
import BudgetGoalProgress from "./BudgetGoalProgress";
import DebtOverview from "./DebtOverview";
import NetWorthCard from "./NetWorthCard";
import Layout from "./Layout";

// Centralized API imports
import { getAllTransactionsForAnalytics, fetchBudgetSummary, fetchCategoryGoals, fetchDebts, getFinancialInsights } from "../api/api";

const Dashboard = () => {
    const [userId, setUserId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpense, setTotalExpense] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [budgetGoals, setBudgetGoals] = useState([]);
    const [debts, setDebts] = useState([]);
    const [insights, setInsights] = useState(null);
    const [insightsLoading, setInsightsLoading] = useState(true);
    const [activePopover, setActivePopover] = useState(null);

    const currentYear = new Date().getFullYear().toString();
    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const currentMonth = months[new Date().getMonth()];
    
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    const totalBalance = totalIncome - totalExpense;

    // Decode token and set userId
    const token = localStorage.getItem("token");
    useEffect(() => {
        if (token) {
            const decodedToken = jwtDecode(token);
            setUserId(decodedToken.userId);
        }
    }, [token]);

    // Fetch all required data
    useEffect(() => {
        if (!userId || !token) return;

        const fetchData = async () => {
            try {
                const [summary, txs, goals, debtsData, mlInsights] = await Promise.all([
                    fetchBudgetSummary(),
                    getAllTransactionsForAnalytics(),
                    fetchCategoryGoals(),
                    fetchDebts(),
                    getFinancialInsights(6)
                ]);

                // Set summary data
                setTotalIncome(summary.totalIncome);
                setTotalExpense(summary.totalExpenses);

                // Set transactions
                const txnsArray = Array.isArray(txs) ? txs : txs?.transactions || [];
                setTransactions(txnsArray);

                // Set budget goals
                setBudgetGoals(goals.categoryGoals || []);

                // Set debts
                setDebts(debtsData || []);

                // Set insights
                setInsights(mlInsights);
                setInsightsLoading(false);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setInsightsLoading(false);
            }
        };

        fetchData();

        window.addEventListener("expensync_data_refresh", fetchData);
        return () => window.removeEventListener("expensync_data_refresh", fetchData);
    }, [userId, token]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [showModal]);

    const availableYears = useMemo(() => {
        const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
        years.add(parseInt(currentYear));
        return Array.from(years).sort((a, b) => b - a);
    }, [transactions, currentYear]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const date = new Date(t.date);
            const matchYear = date.getFullYear().toString() === selectedYear.toString();
            const matchMonth = months[date.getMonth()] === selectedMonth;
            return matchYear && matchMonth;
        });
    }, [transactions, selectedYear, selectedMonth]);

    const monthlyIncome = useMemo(() => filteredTransactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0), [filteredTransactions]);
    const monthlyExpense = useMemo(() => Math.abs(filteredTransactions.filter(t => t.amount < 0).reduce((acc, t) => acc + t.amount, 0)), [filteredTransactions]);
    const budgetUsed = monthlyIncome > 0 ? (monthlyExpense / monthlyIncome) * 100 : 0;

    // Calculate total spent per category using FILTERED transactions
    const calculateSpentPerCategory = (txns) => {
        if (!Array.isArray(txns)) return {}; // safety check
        const spentPerCategory = {};
        txns.forEach(tx => {
            if (tx.amount < 0) {
                if (spentPerCategory[tx.category]) {
                    spentPerCategory[tx.category] += Math.abs(tx.amount);
                } else {
                    spentPerCategory[tx.category] = Math.abs(tx.amount);
                }
            }
        });
        return spentPerCategory;
    };

    // Merge budget goals with spent data (using filtered txns)
    const budgetGoalsWithSpent = budgetGoals.map(goal => {
        const spent = calculateSpentPerCategory(filteredTransactions)[goal.category] || 0;
        return {
            ...goal,
            spent
        };
    });

    return (
        <Layout>
            <div className={`p-8 transition-all duration-500 ease-in-out relative ${showModal ? "blur-sm pointer-events-none" : ""} 
                bg-gradient-to-b from-slate-50 to-white dark:from-[#0c0f1c] dark:to-[#1a1d2e]
                text-slate-800 dark:text-white rounded-3xl shadow-xl sm:px-10`}>
                
                <h2 className="text-4xl font-extrabold mb-12 text-center md:text-left tracking-tight">
                    Your Financial Overview
                </h2>

                {/* Top Cards - OVERALL */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[{
                        title: "Total Balance",
                        amount: totalBalance,
                        icon: <Wallet className="w-8 h-8 text-green-500" />,
                        textColor: totalBalance >= 0 ? "text-green-600" : "text-red-500",
                    }, {
                        title: "Total Income",
                        amount: totalIncome,
                        icon: <ArrowUpRight className="w-8 h-8 text-blue-600" />,
                        textColor: "text-blue-600",
                    }, {
                        title: "Total Expense",
                        amount: totalExpense,
                        icon: <ArrowDownRight className="w-8 h-8 text-red-500" />,
                        textColor: "text-red-500",
                    }].map(({ title, amount, icon, textColor }, idx) => (
                        <div key={idx} className="p-6 rounded-2xl bg-gradient-to-b from-white to-slate-50/90 dark:from-[#0c0f1c] dark:to-[#1a1d2e] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-700/80 transform hover:scale-[1.05] transition-all duration-300 ease-in-out">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold">{title}</h3>
                                {icon}
                            </div>
                            <p className={`text-3xl font-bold ${textColor}`}>
                                ₹{amount !== undefined && amount !== null ? amount.toLocaleString() : "0"}
                            </p>
                        </div>
                    ))}
                    <NetWorthCard income={totalIncome} expense={totalExpense} />
                </div>

                {/* Executive Overview Card */}
                <div className="mt-12 bg-gradient-to-b from-white to-slate-50/90 dark:from-[#0c0f1c] dark:to-[#1a1d2e] backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/80 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-visible z-40 transition-all">
                    <div className="flex items-center gap-3 mb-8 border-b border-slate-200 dark:border-slate-700 pb-4">
                        <div className="p-2.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl border border-blue-500/20">
                            <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Executive Overview</h3>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Financial Signals & Health</p>
                        </div>
                    </div>

                    {insightsLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
                            <div className="h-28 bg-slate-200 dark:bg-slate-800/60 rounded-2xl"></div>
                            <div className="h-28 bg-slate-200 dark:bg-slate-800/60 rounded-2xl"></div>
                        </div>
                    ) : insights ? (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Financial Health Score */}
                                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md shadow-slate-200/50 dark:shadow-none relative overflow-visible group hover:border-indigo-500/50 transition-all z-50">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Financial Health Score</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-extrabold shadow-sm ${
                                                insights.financialHealth?.grade === "Excellent" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-500/30" :
                                                insights.financialHealth?.grade === "Stable" ? "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-500/30" :
                                                insights.financialHealth?.grade === "Moderate" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-500/30" :
                                                "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-500/30"
                                            }`}>
                                                {insights.financialHealth?.grade || "Stable"}
                                            </span>
                                            <div className="relative">
                                                <button
                                                    onMouseEnter={() => setActivePopover('health')}
                                                    onMouseLeave={() => setActivePopover(null)}
                                                    onClick={() => setActivePopover(activePopover === 'health' ? null : 'health')}
                                                    className="p-1 rounded-full text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none"
                                                    title="What influences this score?"
                                                >
                                                    <HelpCircle className="w-4 h-4" />
                                                </button>
                                                {activePopover === 'health' && (
                                                    <div className="fixed inset-x-4 top-1/3 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-3 sm:w-84 md:w-96 bg-white/95 dark:bg-[#111426]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-indigo-500/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(79,70,229,0.15)] p-6 z-[100] text-left transform origin-top transition-all duration-300 ease-out animate-fadeIn">
                                                        <h5 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                            <Activity className="w-3.5 h-3.5" /> What Influences This Score?
                                                        </h5>
                                                        <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed font-medium">
                                                            The Financial Health Score is a holistic measure of your financial well-being, influenced by key behavioral factors:
                                                        </p>
                                                        <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700/50 pt-2.5">
                                                            <li className="flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                                                <span>Savings consistency & growth</span>
                                                            </li>
                                                            <li className="flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                                                <span>Spending stability & cashflow balance</span>
                                                            </li>
                                                            <li className="flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                                                <span>Budget discipline & pacing</span>
                                                            </li>
                                                            <li className="flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                                                <span>Overspending frequency & velocity</span>
                                                            </li>
                                                            <li className="flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                                                <span>Expense-to-income equilibrium</span>
                                                            </li>
                                                            <li className="flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                                                <span>Recurring financial obligations</span>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-4xl font-extrabold text-slate-800 dark:text-white mb-2 tracking-tight">
                                        {insights.financialHealth?.score || 70}<span className="text-lg font-medium text-slate-400">/100</span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                                        {insights.financialHealth?.message}
                                    </p>
                                </div>

                                {/* Dynamic Safe Spending Capacity */}
                                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md shadow-slate-200/50 dark:shadow-none relative overflow-visible group hover:border-slate-300 dark:hover:border-slate-700 transition-all z-50">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Dynamic Safe Spending Capacity</span>
                                        </div>
                                        <div className="relative">
                                            <button
                                                onMouseEnter={() => setActivePopover('safeSpending')}
                                                onMouseLeave={() => setActivePopover(null)}
                                                onClick={() => setActivePopover(activePopover === 'safeSpending' ? null : 'safeSpending')}
                                                className="p-1 rounded-full text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none"
                                                title="About Safe Spending Capacity"
                                            >
                                                <HelpCircle className="w-4 h-4" />
                                            </button>
                                            {activePopover === 'safeSpending' && (
                                                <div className="fixed inset-x-4 top-1/3 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-3 sm:w-84 md:w-96 bg-white/95 dark:bg-[#111426]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-indigo-500/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(79,70,229,0.15)] p-6 z-[100] text-left transform origin-top transition-all duration-300 ease-out animate-fadeIn">
                                                    <h5 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                        <ShieldCheck className="w-3.5 h-3.5" /> About Safe Spending Capacity
                                                    </h5>
                                                    {insights.safeSpendingCapacity?.explanation && (
                                                        <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed font-medium pb-2.5 border-b border-slate-100 dark:border-slate-700/50">
                                                            {insights.safeSpendingCapacity.explanation}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 leading-relaxed font-medium">
                                                        This dynamic limit protects your financial stability by accounting for:
                                                    </p>
                                                    <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700/50 pt-2.5">
                                                        <li className="flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                            <span>Protected monthly savings goals</span>
                                                        </li>
                                                        <li className="flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                            <span>Upcoming recurring obligations</span>
                                                        </li>
                                                        <li className="flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                            <span>Spending volatility & buffer reserves</span>
                                                        </li>
                                                        <li className="flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                            <span>Current monthly budget pacing</span>
                                                        </li>
                                                        <li className="flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                            <span>Recent financial behavior patterns</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-4xl font-extrabold text-slate-800 dark:text-white mb-4 tracking-tight">
                                        ₹{(insights.safeSpendingCapacity?.amount || 0).toLocaleString()}
                                    </div>

                                    {/* Breakdown Metadata */}
                                    <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 mb-1 shadow-sm">
                                        <div className="text-center border-r border-slate-200 dark:border-slate-800">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Protected Savings</p>
                                            <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">₹{(insights.safeSpendingCapacity?.protectedSavings || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="text-center border-r border-slate-200 dark:border-slate-800">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Volatility Reserve</p>
                                            <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">₹{(insights.safeSpendingCapacity?.volatilityReserve || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Obligations</p>
                                            <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">₹{(insights.safeSpendingCapacity?.predictedObligations || 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Critical Overspending Warnings */}
                            {insights.budgetRisk?.length > 0 && (
                                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Velocity Warnings</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {insights.budgetRisk.map((risk, idx) => (
                                            <div key={idx} className={`p-4 rounded-2xl border flex items-start gap-3 shadow-sm shadow-slate-200/50 dark:shadow-none transition-all hover:scale-[1.01] ${
                                                risk.riskLevel === "critical"
                                                    ? "bg-rose-50/90 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/50 text-rose-950 dark:text-rose-200"
                                                    : "bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/50 text-amber-950 dark:text-amber-200"
                                            }`}>
                                                <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${risk.riskLevel === "critical" ? "text-rose-600 dark:text-rose-400 animate-bounce" : "text-amber-600 dark:text-amber-400"}`} />
                                                <p className="text-sm font-semibold leading-relaxed">{risk.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Filters for lower section */}
                <div className="mt-16 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 dark:border-slate-700 pb-4">
                    <h3 className="text-2xl font-bold">Monthly Snapshot</h3>
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

                {/* Budget Progress */}
                <div className="flex flex-col space-y-4 mt-8">
                    <h4 className="text-xl font-semibold">Monthly Budget Usage</h4>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                        <div className="bg-blue-500 h-4 transition-all duration-700 ease-out" style={{ width: `${Math.min(budgetUsed, 100)}%` }} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        ₹{monthlyExpense !== undefined && monthlyExpense !== null ? monthlyExpense.toLocaleString() : "0"} spent out of ₹{monthlyIncome !== undefined && monthlyIncome !== null ? monthlyIncome.toLocaleString() : "0"}
                    </p>
                </div>

                {/* Budget Goals & Expense Chart */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col space-y-4">
                        <h4 className="text-xl font-semibold">Budget Goals</h4>
                        <BudgetGoalProgress goals={budgetGoalsWithSpent} />
                    </div>
                    <div className="flex flex-col space-y-4">
                        <h4 className="text-xl font-semibold">Expense Chart</h4>
                        <ExpenseChart totalIncome={monthlyIncome} totalExpense={monthlyExpense} />
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="mt-16">
                    <h4 className="text-xl font-semibold mb-6">Recent Transactions</h4>
                    <ul className="space-y-4">
                        {transactions.slice(0, 3).map((tx, idx) => (
                            <li key={idx} className="flex justify-between items-center text-sm bg-slate-100 dark:bg-slate-800 px-6 py-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                                <span className="font-semibold">{tx.category}</span>
                                <span className={tx.amount > 0 ? "text-green-500" : "text-red-500"}>
                                    ₹{tx.amount !== undefined && tx.amount !== null ? tx.amount.toLocaleString() : "0"}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Savings */}
                <div className="mt-16">
                    <h4 className="text-xl font-semibold mb-4">Savings This Month</h4>
                    <p className="text-4xl font-extrabold text-green-600">
                        ₹{(totalIncome - totalExpense) !== undefined && (totalIncome - totalExpense) !== null ? (totalIncome - totalExpense).toLocaleString() : "0"}
                    </p>
                </div>

                {/* Debt Overview */}
                <DebtOverview debts={debts} />
            </div>

            {/* Floating Add Button */}
            <button onClick={() => setShowModal(true)} className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-full shadow-2xl z-50 transition-all duration-300">
                <Plus className="w-8 h-8" />
            </button>

            {/* Modal for Add Transaction */}
            {showModal && userId && (
                <div className="fixed inset-0 z-40 bg-white/30 dark:bg-slate-800/30 backdrop-blur-md overflow-y-auto" onClick={() => setShowModal(false)}>
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                            <AddTransaction userId={userId} onSuccess={() => setShowModal(false)} />
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Dashboard;
