import React, { useEffect, useState, useRef } from "react";
import { ArrowDownCircle, ArrowUpCircle, MinusCircle, Repeat, AlertTriangle, Sparkles } from "lucide-react";
import TransactionReminders from "./TransactionReminders";
import Layout from "./Layout";
import { getTransactions, deleteTransaction, getFinancialInsights } from "../api/api";

const ConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg w-[90%] max-w-sm">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
          Confirm Delete
        </h3>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Are you sure you want to delete this transaction? This action cannot
          be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [insights, setInsights] = useState(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const listRef = useRef();
  const loadingRef = useRef(false);
  const pageRef = useRef(page);
  const hasMoreRef = useRef(hasMore);

  // 🔥 Fetch with pagination, search, filter
  const fetchTransactions = async (pageNum = 1, reset = false) => {
    console.log(
      `📡 Fetching transactions | page=${pageNum}, search="${search}", filter="${filter}"`
    );
    setLoading(true);
    loadingRef.current = true;
    try {
      const res = await getTransactions(pageNum, 10, search, filter);
      if (reset) {
        setTransactions(res.transactions);
      } else {
        setTransactions((prev) => [...prev, ...res.transactions]);
      }
      setHasMore(res.hasMore);
      hasMoreRef.current = res.hasMore;
      setPage(pageNum);
      pageRef.current = pageNum;
    } catch (error) {
      console.error("❌ Error fetching transactions:", error);
      setError("Error fetching transactions");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  // Removed redundant on-mount useEffect since search/filter hook runs on mount.

  // ✅ Re-fetch on search/filter change (debounced)
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchTransactions(1, true);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [search, filter]);

  // ✅ Fetch AI Financial Insights & Handle Global Data Refresh
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const mlInsights = await getFinancialInsights(6, true);
        setInsights(mlInsights);
      } catch (err) {
        console.error("Failed to fetch insights:", err);
      }
    };
    fetchInsights();

    const handleRefresh = () => {
      fetchTransactions(1, true);
      fetchInsights();
    };

    window.addEventListener("expensync_data_refresh", handleRefresh);
    return () => window.removeEventListener("expensync_data_refresh", handleRefresh);
  }, [search, filter]);

  // ✅ Infinite scroll
  useEffect(() => {
    const div = listRef.current;
    if (!div) return;

    const handleScroll = () => {
      if (
        hasMoreRef.current &&
        !loadingRef.current &&
        div.scrollTop + div.clientHeight >= div.scrollHeight - 50
      ) {
        fetchTransactions(pageRef.current + 1);
      }
    };

    div.addEventListener("scroll", handleScroll);
    return () => div.removeEventListener("scroll", handleScroll);
  }, []);

  const openDeleteModal = (id) => {
    setDeleteId(id);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteTransaction(deleteId);
      setTransactions((prev) => prev.filter((txn) => txn._id !== deleteId));
    } catch (err) {
      console.error("❌ Error deleting transaction:", err);
      alert("Error deleting transaction");
    } finally {
      setIsModalOpen(false);
      setDeleteId(null);
    }
  };

  const totalSpent = transactions
    .filter((txn) => txn.amount < 0)
    .reduce((sum, txn) => sum + txn.amount, 0);

  const totalIncome = transactions
    .filter((txn) => txn.amount > 0)
    .reduce((sum, txn) => sum + txn.amount, 0);

  const net = totalIncome + totalSpent;

  return (
    <Layout>
      <div className="bg-gradient-to-br from-slate-50 to-white dark:from-[#0c0f1c] dark:to-[#1a1d2e] border border-slate-200 dark:border-slate-700 p-6 sm:p-8 md:p-10 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] transition-all duration-500">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-slate-800 dark:text-white mb-10">
          💳 Transaction Dashboard
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12">
          {/* LEFT SIDE */}
          <div className="flex flex-col">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-5 py-3 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition backdrop-blur-md shadow-sm"
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full sm:w-60 px-5 py-3 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-white transition shadow-sm"
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

            {error && <p className="text-red-500">{error}</p>}

            <ul
              ref={listRef}
              className="space-y-5 max-h-[880px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600"
            >
              {transactions.map((txn) => (
                <li
                  key={txn._id}
                  className="flex items-center justify-between bg-gradient-to-tr from-white/60 to-slate-200/60 dark:from-slate-800/60 dark:to-slate-700/60 rounded-2xl px-6 py-4"
                >
                  <div className="flex items-center gap-4">
                    {txn.amount < 0 ? (
                      <ArrowDownCircle className="text-red-500 flex-shrink-0" size={26} />
                    ) : (
                      <ArrowUpCircle className="text-green-500 flex-shrink-0" size={26} />
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-lg font-semibold text-slate-800 dark:text-white">
                          {txn.title}
                        </p>
                        {/* Inline AI Badges */}
                        {insights?.recurringExpenses?.some(r => r.merchant?.toLowerCase() === txn.title?.toLowerCase() || txn.title?.toLowerCase()?.includes(r.merchant?.toLowerCase())) && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 text-xs font-bold border border-blue-300 dark:border-blue-800/80 flex items-center gap-1 shadow-sm" title="AI detected recurring subscription">
                            <Repeat size={12} /> Recurring
                          </span>
                        )}
                        {insights?.anomalies?.some(a => a.transactionId === txn._id) && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text.amber-300 text-xs font-bold border border-amber-300 dark:border-amber-800/80 flex items-center gap-1 shadow-sm" title="AI detected unusual spending amount">
                            <AlertTriangle size={12} /> Unusual Amount
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {txn.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className={`text-xl font-bold ${
                        txn.amount < 0 ? "text-red-500" : "text-green-500"
                      }`}
                    >
                      ₹{txn.amount}
                    </div>
                    <button
                      onClick={() => openDeleteModal(txn._id)}
                      className="text-red-500 hover:text-red-700 transition"
                      title="Delete transaction"
                    >
                      <MinusCircle size={24} />
                    </button>
                  </div>
                </li>
              ))}

              {loading && (
                <p className="text-center text-slate-500 dark:text-slate-400 py-2">
                  Loading more...
                </p>
              )}
              {!hasMore && !loading && (
                <p className="text-center text-slate-400 italic py-2">
                  No more transactions
                </p>
              )}
            </ul>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex flex-col gap-8">
            <div className="bg-gradient-to-b from-slate-100/60 to-slate-200/60 dark:from-[#0c0f1c] dark:to-[#1a1d2e] p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 h-fit">
              <h3 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">
                Summary:{" "}
                <span className="text-purple-600 dark:text-purple-400">
                  {filter || "All Categories"}
                </span>
              </h3>
              <ul className="space-y-4 text-slate-700 dark:text-slate-300">
                <li>
                  <span className="font-semibold">🧾 Total Transactions:</span>{" "}
                  {transactions.length}
                </li>
                <li>
                  <span className="font-semibold">💸 Total Spent:</span> ₹
                  {Math.abs(totalSpent)}
                </li>
                <li>
                  <span className="font-semibold">💰 Total Income:</span> ₹
                  {totalIncome}
                </li>
                <li>
                  <span className="font-semibold">🔴 Net Balance:</span> ₹{net}
                </li>
              </ul>
            </div>

            {/* Merchant Insights Sidebar */}
            <div className="bg-gradient-to-b from-white to-slate-50/90 dark:from-[#0c0f1c] dark:to-[#1a1d2e] p-6 sm:p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-700/80 h-fit relative overflow-hidden backdrop-blur-xl transition-all">
              <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
              <div className="flex items-center gap-4 mb-8 border-b border-slate-200 dark:border-slate-700 pb-6">
                <div className="p-3 bg-purple-500/10 dark:bg-purple-500/20 rounded-2xl border border-purple-500/20">
                  <AlertTriangle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Merchant Insights</h3>
                  <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider mt-0.5">Spending Irregularities & Outliers</p>
                </div>
              </div>

              {insights ? (
                <div className="space-y-8">
                  {/* Recent Anomalies */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <AlertTriangle size={16} className="text-amber-500" /> Unusual Spending Outliers
                    </h4>
                    {insights.anomalies?.length > 0 ? (
                      <ul className="space-y-3">
                        {insights.anomalies.map((anom, idx) => (
                          <li key={idx} className="p-5 rounded-2xl bg-white dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 shadow-md shadow-slate-200/50 dark:shadow-none hover:scale-[1.01] transition-all duration-300 flex flex-col gap-3">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                  <AlertTriangle size={15} className="text-amber-500 flex-shrink-0" />
                                  <span className="font-bold text-slate-800 dark:text-white text-sm tracking-tight">
                                    Large {anom.category || "Expense"} Detected
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-sm ${
                                    anom.severity === 'critical' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800/80' :
                                    anom.severity === 'high' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800/80' :
                                    'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800/80'
                                  }`}>
                                    {anom.severity || "Medium"}
                                  </span>
                                </div>
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                  ₹{anom.amount?.toLocaleString()} at {anom.merchant || anom.title || "Unknown Merchant"}
                                </p>
                              </div>
                              <span className="text-lg font-bold text-amber-600 dark:text-amber-400 flex-shrink-0">
                                ₹{anom.amount?.toLocaleString()}
                              </span>
                            </div>
                            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700/50 flex flex-col gap-1.5">
                              <p className="text-xs text-slate-500 dark:text-slate-300 font-medium leading-relaxed">
                                {anom.reason || anom.explanation || `Exceeds normal average (₹{anom.normalAverage?.toLocaleString()}).`}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-6 text-center rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 shadow-sm shadow-slate-200/50 dark:shadow-none">
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">No unusual spending anomalies detected this month.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-pulse">
                  <div className="h-20 bg-slate-200 dark:bg-slate-800/60 rounded-2xl"></div>
                  <div className="h-20 bg-slate-200 dark:bg-slate-800/60 rounded-2xl"></div>
                </div>
              )}
            </div>

            <TransactionReminders />
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </Layout>
  );
};

export default Transactions;
