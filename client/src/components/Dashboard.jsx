import { ArrowDownRight, ArrowUpRight, Wallet, Plus } from "lucide-react";
import AddTransaction from "./AddTransaction";
import { useState } from "react";
import ExpenseChart from "./ExpenseChart";
import BudgetGoalProgress from "./BudgetGoalProgress";
import DebtOverview from "./DebtOverview";
import NetWorthCard from "./NetWorthCard";
import Layout from "./Layout";


const Dashboard = ({ totalIncome = 20000, totalExpense = 5000 }) => {
    const [showModal, setShowModal] = useState(false);

    const totalBalance = totalIncome - totalExpense;
    const budgetUsed = Math.min((totalExpense / totalIncome) * 100, 100);

    // Dummy Data (replace with dynamic later)
    const transactions = [
        { category: "Groceries", amount: -1200 },
        { category: "Salary", amount: 15000 },
        { category: "Internet Bill", amount: -800 },
    ];

    const budgetGoals = [
        { category: "Food", goal: 5000, spent: 4200 },
        { category: "Entertainment", goal: 3000, spent: 2800 },
        { category: "Utilities", goal: 2000, spent: 2100 },
        { category: "Travel", goal: 4000, spent: 1800 },
    ];

    const debts = [
        { name: "Credit Card", amount: 4500 },
        { name: "Personal Loan", amount: 12000 },
    ];

    return (
        <Layout>
            <div 
            className={`p-8 transition-all duration-500 ease-in-out relative ${showModal ? "blur-sm pointer-events-none" : ""} 
            bg-gradient-to-b from-slate-50 to-white dark:from-[#0c0f1c] dark:to-[#1a1d2e]
            text-slate-800 dark:text-white rounded-3xl shadow-xl  sm:px-10 `}
            >
                <h2 className="text-4xl font-extrabold mb-12 text-center md:text-left tracking-tight text-slate-800 dark:text-white">
                    Your Financial Overview
                </h2>

                {/* Top Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                        {
                            title: "Total Balance",
                            amount: totalBalance,
                            icon: <Wallet className="w-8 h-8 text-green-500" />,
                            gradient: "bg-gradient-to-b from-slate-100/60 to-slate-200/60 dark:from-[#0c0f1c] dark:to-[#1a1d2e]",
                            textColor: totalBalance >= 0 ? "text-green-600" : "text-red-500",
                        },
                        {
                            title: "Total Income",
                            amount: totalIncome,
                            icon: <ArrowUpRight className="w-8 h-8 text-blue-600" />,
                            gradient: "bg-gradient-to-b from-slate-100/60 to-slate-200/60 dark:from-[#0c0f1c] dark:to-[#1a1d2e]",
                            textColor: "text-blue-600",
                        },
                        {
                            title: "Total Expense",
                            amount: totalExpense,
                            icon: <ArrowDownRight className="w-8 h-8 text-red-500" />,
                            gradient: "bg-gradient-to-b from-slate-100/60 to-slate-200/60 dark:from-[#0c0f1c] dark:to-[#1a1d2e]",
                            textColor: "text-red-500",
                        },
                    ].map(({ title, amount, icon, gradient, textColor }, idx) => (
                        <div
                            key={idx}
                            className={`p-6 rounded-2xl bg-gradient-to-tr ${gradient} shadow-xl border border-slate-200 dark:border-slate-700 transform hover:scale-[1.05] transition-all duration-300 ease-in-out`}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
                                {icon}
                            </div>
                            <p className={`text-3xl font-bold ${textColor}`}>₹{amount.toLocaleString()}</p>
                        </div>
                    ))}

                    {/* Net Worth Card */}
                    <NetWorthCard income={totalIncome} expense={totalExpense} />
                </div>
                {/* Budget Progress */}
                <div className="flex flex-col space-y-4">
                    <h4 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Monthly Budget Usage</h4>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                        <div
                            className="bg -blue-500 h-4 transition-all duration-700 ease-out"
                            style={{ width: `${budgetUsed}%` }}
                        />
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        ₹{totalExpense.toLocaleString()} spent out of ₹{totalIncome.toLocaleString()}
                    </p>
                </div>
                {/* Budget Progress and Expense Chart */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Budget Goal Progress */}
                    <div className=" flex flex-col space-y-4">
                        <h4 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Budget Goals</h4>
                        <div className="w-full md:w-2/2"> {/* Adjust width here */}
                            <BudgetGoalProgress goals={budgetGoals} />
                        </div>
                    </div>
                    {/* Expense Chart */}
                    <div className="flex flex-col space-y-4">
                        <h4 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Expense Chart</h4>
                        <ExpenseChart />
                    </div>
                </div>



                {/* Recent Transactions */}
                <div className="mt-16">
                    <h4 className="text-xl font-semibold mb-6 text-slate-800 dark:text-white">Recent Transactions</h4>
                    <ul className="space-y-4">
                        {transactions.slice(0, 3).map((tx, idx) => (
                            <li
                                key={idx}
                                className="flex justify-between items-center text-sm bg-slate-100 dark:bg-slate-800 px-6 py-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                            >
                                <span className="font-semibold">{tx.category}</span>
                                <span className={tx.amount > 0 ? "text-green-500" : "text-red-500"}>
                                    ₹{tx.amount.toLocaleString()}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Savings */}
                <div className="mt-16">
                    <h4 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Savings This Month</h4>
                    <p className="text-4xl font-extrabold text-green-600 tracking-tight">
                        ₹{(totalIncome - totalExpense).toLocaleString()}
                    </p>
                </div>

                {/* Debt Overview */}
                <DebtOverview debts={debts} />
            </div>

            {/* Floating Add Button */}
            <button
                onClick={() => setShowModal(true)}
                className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-full shadow-2xl z-50 transition-all duration-300"
            >
                <Plus className="w-8 h-8" />
            </button>

            {/* Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 z-40 bg-white/30 dark:bg-slate-800/30 backdrop-blur-md flex items-center justify-center p-6"
                    onClick={() => setShowModal(false)}
                >
                    <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                        <AddTransaction
                            userId={"demo-user"}
                            onSuccess={() => setShowModal(false)}
                        />
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Dashboard;