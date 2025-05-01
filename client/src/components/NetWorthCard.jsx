import { Wallet } from "lucide-react";

const NetWorthCard = ({ income = 0, expense = 0 }) => {
    const netWorth = income - expense;

    return (
        <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-100/60 to-slate-200/60 dark:from-[#0c0f1c] dark:to-[#1a1d2e] shadow-xl border border-slate-200 dark:border-slate-700 transform hover:scale-[1.05] transition-all duration-300 ease-in-out">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Net Worth</h3>
                <Wallet className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-600">₹{netWorth.toLocaleString()}</p>
            <p className="text-sm mt-2 text-slate-600 dark:text-slate-400">(Income - Expenses)</p>
        </div>
    );
};

export default NetWorthCard;
