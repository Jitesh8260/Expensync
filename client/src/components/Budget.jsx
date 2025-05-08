import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import Layout from "./Layout";

// Category Budget Goals Subcomponent
const CategoryBudgetGoals = ({ goals, setGoals }) => {
    const defaultCategories = ["Food", "Entertainment", "Utilities", "Travel", "Savings", "Others"];

    const handleChange = (category, value) => {
        const amount = parseInt(value) || 0;
        const updatedGoals = { ...goals, [category]: amount };
        setGoals(updatedGoals);
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem("token");
            const categoryGoals = Object.entries(goals).map(([category, goal]) => ({
                category,
                goal: parseFloat(goal)  // Ensure the goal is a number
            }));

            const response = await axios.post(
                "http://localhost:5000/api/category-goals/set",
                { categoryGoals },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            console.log(response.data);  // Log the response from the server
            alert("Category goals saved successfully!");
        } catch (error) {
            console.error("Failed to update category goals:", error.response?.data || error.message);
            alert(`Failed to update category goals: ${error.response?.data?.message || error.message}`);
        }
    };


    const totalBudget = Object.values(goals).reduce((sum, val) => sum + (parseInt(val) || 0), 0); // Ensure the value is a number

    return (
        <div className="mt-15 bg-gradient-to-b from-slate-100/60 to-slate-200/60 dark:from-[#0c0f1c] dark:to-[#1a1d2e] border border-slate-200 dark:border-slate-700 p-8 rounded-3xl shadow-xl w-full">
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
                            value={goals[category] || 0}
                            onChange={(e) => handleChange(category, e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white transition-all"
                            placeholder="₹0"
                        />
                    </div>
                ))}
            </div>

            <div className="mt-6 text-center text-slate-600 dark:text-slate-300 text-lg font-medium">
                🧾 Total Category Budget: <span className="font-bold text-indigo-600 dark:text-indigo-400">₹{totalBudget}</span>
            </div>

            {/* Save Button */}
            <div className="mt-6 text-center">
                <button
                    onClick={handleSave}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all"
                >
                    Save Goals
                </button>
            </div>
        </div>
    );
};

// Main Budget Component
const Budget = () => {
    const [budget, setBudget] = useState(0);
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [goals, setGoals] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");

                const [summaryRes, goalsRes] = await Promise.all([
                    axios.get("http://localhost:5000/api/summary/summary", {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                    axios.get("http://localhost:5000/api/category-goals/", {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                ]);
                console.log(summaryRes.data);
                console.log(goalsRes.data);
                const { totalBudget, totalIncome, totalExpenses } = summaryRes.data;
                setBudget(totalBudget);
                setTotalIncome(totalIncome);
                setTotalExpenses(totalExpenses);
                const formattedGoals = (goalsRes.data.categoryGoals || []).reduce((acc, curr) => {
                    acc[curr.category] = curr.goal;
                    return acc;
                }, {});
                setGoals(formattedGoals);
                // setGoals(goalsRes.data || {}); // Set the initial goals
            } catch (err) {
                console.error("Failed to fetch budget data:", err);
                alert("Failed to fetch data. Please try again later.");
            }
        };

        fetchData();
    }, []);

    const savings = budget - totalExpenses;
    const remainingBudget = budget - totalExpenses;
    const expensePercentage = Math.min((totalExpenses / budget) * 100, 100);

    return (
        <Layout>
            <div className="bg-gradient-to-b from-slate-50 to-white dark:from-[#0c0f1c] dark:to-[#1a1d2e] border border-slate-200 dark:border-slate-700 p-10 rounded-3xl shadow-xl flex flex-col md:flex-row gap-10">
                {/* Left Section (Budget Snapshot) */}
                <div className="w-full md:w-2/3">
                    <h2 className="text-4xl font-extrabold text-center text-slate-800 dark:text-white mb-12 tracking-tight">
                        💸 Monthly Budget Snapshot
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mb-10">
                        {[{
                            label: "Budget", value: budget, color: "text-slate-900 dark:text-white"
                        }, {
                            label: "Income", value: totalIncome, color: "text-green-600 dark:text-green-400"
                        }, {
                            label: "Expenses", value: totalExpenses, color: "text-red-500 dark:text-red-400"
                        }, {
                            label: "Savings", value: savings, color: "text-blue-600 dark:text-blue-400"
                        }].map(({ label, value, color }) => (
                            <div key={label}
                                className="bg-gradient-to-tr from-white/60 to-slate-200/60 dark:from-slate-800/60 dark:to-slate-700/60 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-6 rounded-2xl hover:shadow-lg transition-all"
                            >
                                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium mb-2">{label}</p>
                                <p className={`text-2xl font-bold ${color}`}>₹{value}</p>
                            </div>
                        ))}
                    </div>

                    <p className="text-center text-base text-slate-600 dark:text-slate-300 mb-6">
                        You've used <span className="font-semibold text-indigo-600 dark:text-indigo-400">₹{totalExpenses}</span> out of your
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400"> ₹{budget}</span> budget.
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

                    <div className="mt-6 bg-gradient-to-tr from-white/60 to-slate-200/60 dark:from-slate-800/60 dark:to-slate-700/60 backdrop-blur-md p-6 rounded-xl text-center shadow-sm">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">💡 Smart Tip</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Keep expenses under <span className="font-semibold text-indigo-600 dark:text-indigo-400">70%</span> of your budget for consistent savings!
                        </p>
                    </div>
                </div>

                {/* Right Section (Category Goals) */}
                <div className="w-full md:w-1/3 mt-6 md:mt-0">
                    <CategoryBudgetGoals goals={goals} setGoals={setGoals} />
                </div>
            </div>
        </Layout>
    );
};

export default Budget;
