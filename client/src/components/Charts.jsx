import React, { useEffect, useState } from "react";
import ExpenseChart from "./ExpenseChart";
import ExpenseCategoryChart from "./ExpenseCategoryChart";
import { motion } from "framer-motion";
import Layout from "./Layout";
import { getTransactions } from "../api/api"; // centralized API import

const Charts = () => {
    const [transactions, setTransactions] = useState([]);
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpense, setTotalExpense] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getTransactions(); // centralized API call
                const txns = Array.isArray(data) ? data : data?.transactions || [];

                setTransactions(txns);

                const income = txns
                    .filter((t) => t.amount > 0)
                    .reduce((acc, t) => acc + t.amount, 0);

                const expense = txns
                    .filter((t) => t.amount < 0)
                    .reduce((acc, t) => acc + t.amount, 0);

                setTotalIncome(income);
                setTotalExpense(Math.abs(expense));
            } catch (err) {
                console.error("Failed to fetch transactions:", err);
            }
        };

        fetchData();
    }, []);

    return (
        <Layout>
            <div className="rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-[#0c0f1c] dark:to-[#1a1d2e] p-6 sm:p-10 space-y-10">
                <div className="text-center">
                    <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1E2A45] dark:text-white">
                        Financial Dashboard
                    </h2>
                    <p className="mt-4 text-lg sm:text-xl text-slate-700 dark:text-slate-400 max-w-2xl mx-auto">
                        A visual glance at your income and spending patterns.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.6 }}
                    >
                        <h3 className="text-xl font-semibold text-[#1E2A45] dark:text-white mb-4">Income vs Expense</h3>
                        <ExpenseChart totalIncome={totalIncome} totalExpense={totalExpense} />
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        <h3 className="text-xl font-semibold text-[#1E2A45] dark:text-white mb-4">Spending by Category</h3>
                        <ExpenseCategoryChart transactions={transactions} />
                    </motion.div>
                </div>
            </div>
        </Layout>
    );
};

export default Charts;
