import React, { useState } from "react";

const defaultCategories = ["Food", "Entertainment", "Utilities", "Travel", "Savings", "Others"];

const CategoryBudgetGoals = () => {
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
        setGoals((prev) => ({
            ...prev,
            [category]: amount,
        }));
    };

    const totalBudget = Object.values(goals).reduce((sum, val) => sum + val, 0);

    return (
        <div className="mt-10 bg-gradient-to-br from-slate-100/60 to-slate-200/60 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 p-8 rounded-3xl shadow-2xl max-w-2xl mx-auto transition-all duration-500">
            <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-8 tracking-tight">
                🎯 Category Budget Goals
            </h2>

            <div className="space-y-4">
                {defaultCategories.map((category) => (
                    <div key={category} className="flex items-center justify-between gap-4">
                        <label className="text-base text-slate-700 dark:text-white font-medium">
                            {category}
                        </label>
                        <input
                            type="number"
                            min={0}
                            value={goals[category]}
                            onChange={(e) => handleChange(category, e.target.value)}
                            className="w-40 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white transition"
                            placeholder="₹0"
                        />
                    </div>
                ))}
            </div>

            <div className="mt-6 text-center text-slate-600 dark:text-slate-300 font-medium">
                🧾 Total Monthly Budget Set:{" "}
                <span className="font-bold text-slate-800 dark:text-white">₹{totalBudget}</span>
            </div>
        </div>
    );
};

export default CategoryBudgetGoals;
