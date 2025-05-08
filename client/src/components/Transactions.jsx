import React, { useEffect, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import TransactionReminders from "./TransactionReminders";
import Layout from "./Layout";
import { getTransactions } from "../api/api";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const transactionsData = await getTransactions(); // No userId
      setTransactions(transactionsData);
    } catch (error) {
      setError("Error fetching transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filteredTransactions = transactions.filter((txn) => {
    return (
      (!filter || txn.category === filter) &&
      txn.title.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalSpent = filteredTransactions
    .filter((txn) => txn.amount < 0)
    .reduce((sum, txn) => sum + txn.amount, 0);

  const totalIncome = filteredTransactions
    .filter((txn) => txn.amount > 0)
    .reduce((sum, txn) => sum + txn.amount, 0);

  const net = totalIncome + totalSpent;

  return (
    <Layout>
      <div className="bg-gradient-to-br from-slate-50 to-white dark:from-[#0c0f1c] dark:to-[#1a1d2e] border border-slate-200 dark:border-slate-700 p-6 sm:p-8 md:p-10 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] transition-all duration-500">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-slate-800 dark:text-white mb-10 tracking-tight leading-snug drop-shadow-sm">
          💳 Transaction Dashboard
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12">
          {/* LEFT SIDE */}
          <div className="flex flex-col">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-5 py-3 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition backdrop-blur-md shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="w-full sm:w-60 px-5 py-3 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-white transition shadow-sm"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Food">Food</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Travel">Travel</option>
                <option value="Utilities">Utilities</option>
                <option value="Income">Income</option>
                <option value="Others">Others</option>
              </select>
            </div>

            {loading && <p>Loading transactions...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {filteredTransactions.length === 0 ? (
              <p className="text-center text-slate-500 dark:text-slate-400 italic mt-8">
                No transactions found.
              </p>
            ) : (
              <ul className="space-y-5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent hover:scrollbar-thumb-purple-400 dark:hover:scrollbar-thumb-purple-500 transition-all duration-300 overflow-x-hidden">
                {filteredTransactions.map((txn) => (
                  <li
                    key={txn._id}
                    className="flex items-center justify-between bg-gradient-to-tr from-white/60 to-slate-200/60 dark:from-slate-800/60 dark:to-slate-700/60 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 shadow-sm hover:shadow-[0_12px_30px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-300 ease-in-out"
                  >
                    <div className="flex items-center gap-4">
                      {txn.amount < 0 ? (
                        <ArrowDownCircle className="text-red-500" size={26} />
                      ) : (
                        <ArrowUpCircle className="text-green-500" size={26} />
                      )}
                      <div>
                        <p className="text-lg font-semibold text-slate-800 dark:text-white">
                          {txn.title}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {txn.category}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`text-xl font-bold tracking-wide drop-shadow-sm ${txn.amount < 0 ? "text-red-500" : "text-green-500"
                        }`}
                    >
                      ₹{txn.amount}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* RIGHT SIDE */}
          <div className="flex flex-col gap-8">
            <div className="bg-gradient-to-b from-slate-100/60 to-slate-200/60 dark:from-[#0c0f1c] dark:to-[#1a1d2e] p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 h-fit transition-all duration-300 backdrop-blur-sm">
              <h3 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">
                Summary:{" "}
                <span className="text-purple-600 dark:text-purple-400">
                  {filter || "All Categories"}
                </span>
              </h3>
              <ul className="space-y-4 text-slate-700 dark:text-slate-300 text-base leading-relaxed">
                <li>
                  <span className="font-semibold">🧾 Total Transactions:</span>{" "}
                  {filteredTransactions.length}
                </li>
                <li>
                  <span className="font-semibold">💸 Total Spent:</span> ₹{Math.abs(totalSpent)}
                </li>
                <li>
                  <span className="font-semibold">💰 Total Income:</span> ₹{totalIncome}
                </li>
                <li>
                  <span className="font-semibold">🔴 Net Balance:</span> ₹{net}
                </li>
              </ul>
            </div>

            <TransactionReminders />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Transactions;
