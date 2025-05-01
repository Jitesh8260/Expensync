import React, { useState } from "react";
import { motion } from "framer-motion";
import Layout from "./Layout";

const CategoryBudgetGoals = () => {
    const defaultCategories = ["Food", "Entertainment", "Utilities", "Travel", "Savings", "Others"];
    const [goals, setGoals] = useState({
        Food: 0,
        Entertainment: 0,
        Utilities: 0,
        Travel: 0,
        Savings: 0,
        Others: 0,
    });

    const handleChange = (category, value) => {
        const amount = parseInt(value) || 0;
        setGoals((prev) => ({ ...prev, [category]: amount }));
    };

    const totalBudget = Object.values(goals).reduce((sum, val) => sum + val, 0);

    return (
        <div className="mt-15 bg-gradient-to-b from-slate-100/60 to-slate-200/60 dark:from-[#0c0f1c] dark:to-[#1a1d2e] border border-slate-200 dark:border-slate-700 p-8 rounded-3xl shadow-xl w-4/5 mx-auto">
            <h3 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-6 tracking-tight">
                🎯 Set Category-wise Budget Goals
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {defaultCategories.map((category) => (
                    <div key={category} className="flex flex-col gap-2">
                        <label className="text-base font-medium text-slate-700 dark:text-white">{category}</label>
                        <input
                            type="number"
                            min={0}
                            value={goals[category]}
                            onChange={(e) => handleChange(category, e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white transition-all"
                            placeholder="₹0"
                        />
                    </div>
                ))}
            </div>

            <div className="mt-6 text-center text-slate-600 dark:text-slate-300 text-lg font-medium">
                🧾 Total Budget: <span className="font-bold text-indigo-600 dark:text-indigo-400">₹{totalBudget}</span>
            </div>
        </div>
    );
};

const Budget = ({ totalIncome = 80000, totalExpense = 25000 }) => {
    const [budget, setBudget] = useState(60000);
    const remainingBudget = budget - totalExpense;
    const savings = totalIncome - totalExpense;
    const expensePercentage = Math.min((totalExpense / budget) * 100, 100);

    return (
        <Layout>
                <div className="bg-gradient-to-b from-slate-50 to-white dark:from-[#0c0f1c] dark:to-[#1a1d2e] border border-slate-200 dark:border-slate-700 p-10 rounded-3xl shadow-xl flex flex-col md:flex-row gap-10">
                    {/* Left Section (Budget Overview) */}
                    <div className="w-full md:w-2/3">
                        <h2 className="text-4xl font-extrabold text-center text-slate-800 dark:text-white mb-12 tracking-tight">
                            💸 Monthly Budget Snapshot
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mb-10">
                            {[
                                { label: "Budget", value: budget, color: "text-slate-900 dark:text-white" },
                                { label: "Income", value: totalIncome, color: "text-green-600 dark:text-green-400" },
                                { label: "Expenses", value: totalExpense, color: "text-red-500 dark:text-red-400" },
                                { label: "Savings", value: savings, color: "text-blue-600 dark:text-blue-400" },
                            ].map(({ label, value, color }) => (
                                <div key={label}
                                    className="bg-gradient-to-tr from-white/60 to-slate-200/60 dark:from-slate-800/60 dark:to-slate-700/60 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-6 rounded-2xl hover:shadow-lg transition-all"
                                >
                                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium mb-2">
                                        {label}
                                    </p>
                                    <p className={`text-2xl font-bold ${color}`}>₹{value}</p>
                                </div>
                            ))}
                        </div>

                        <p className="text-center text-base text-slate-600 dark:text-slate-300 mb-6">
                            You've used <span className="font-semibold text-indigo-600 dark:text-indigo-400">₹{totalExpense}</span> out of your
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400"> ₹{budget}</span> budget.
                        </p>

                        <div className="relative w-full bg-slate-200 dark:bg-slate-700 h-4 rounded-full overflow-hidden mb-8 shadow-sm">
                            <div
                                className={`h-full ${remainingBudget < 0 ? "bg-red-500" : "bg-indigo-500"
                                    } transition-all duration-700`}
                                style={{ width: `${expensePercentage}%` }}
                            ></div>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600 dark:text-slate-300">
                                {expensePercentage.toFixed(0)}%
                            </span>
                        </div>

                        <div className="mt-6 bg-gradient-to-tr from-white/60 to-slate-200/60 dark:from-slate-800/60 dark:to-slate-700/60 backdrop-blur-md p-6 rounded-xl text-center shadow-sm">
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">💡 Smart Tip</p>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Keep expenses under <span className="font-semibold text-indigo-600 dark:text-indigo-400">70%</span> of your budget for consistent savings!
                            </p>
                        </div>
                    </div>

                    {/* Right Section (Category Budget Goals) */}
                    <div className="w-full md:w-1/3 mt-6 md:mt-0">
                        <CategoryBudgetGoals />
                    </div>
                </div>
        </Layout>
    );
};

export default Budget;