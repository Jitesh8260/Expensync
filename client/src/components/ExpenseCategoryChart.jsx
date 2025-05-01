import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";

Chart.register(ArcElement, Tooltip, Legend);

const ExpenseCategoryChart = ({ transactions = [] }) => {
    // Original dynamic logic (future use):
    /*
    if (!Array.isArray(transactions)) {
        console.error("Expected transactions to be an array, but received:", transactions);
        return null;
    }

    const categoryTotals = transactions.reduce((acc, txn) => {
        if (txn.amount < 0) {
            const category = txn.category || "Other";
            acc[category] = (acc[category] || 0) + Math.abs(txn.amount);
        }
        return acc;
    }, {});
    */

    // Dummy static data for now:
    const categoryTotals = {
        Food: 1200,
        Travel: 800,
        Shopping: 500,
        Rent: 3000,
        Entertainment: 600,
        Other: 400,
    };

    const data = {
        labels: Object.keys(categoryTotals),
        datasets: [
            {
                data: Object.values(categoryTotals),
                backgroundColor: [
                    "#EF4444", "#F59E0B", "#10B981",
                    "#3B82F6", "#8B5CF6", "#EC4899",
                ],
                borderWidth: 2,
            },
        ],
    };

    const options = {
        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    color: "#64748b",
                },
            },
        },
        responsive: true,
        maintainAspectRatio: false,
    };

    return (
        <div className="bg-gradient-to-b from-slate-100/60 to-slate-200/60 dark:from-[#0c0f1c] dark:to-[#1a1d2e] border border-slate-200 dark:border-slate-700 p-8 rounded-3xl shadow-2xl w-full min-h-[400px] flex flex-col justify-center transition-all duration-500 hover:scale-[1.02]">
            <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-6 tracking-tight">
                💸 Category-wise Expenses
            </h2>
            <div className="flex-grow flex items-center justify-center">
                <div className="w-60 h-60 sm:w-72 sm:h-72">
                    <Doughnut data={data} options={options} />
                </div>
            </div>
        </div>
    );
};

export default ExpenseCategoryChart;
