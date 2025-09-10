import React, { useEffect, useState, useRef } from "react";
import { ArrowDownCircle, ArrowUpCircle, MinusCircle } from "lucide-react";
import TransactionReminders from "./TransactionReminders";
import Layout from "./Layout";
import { getTransactions, deleteTransaction } from "../api/api";

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

  // ✅ Initial load (mount pe ek hi call)
  useEffect(() => {
    fetchTransactions(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Re-fetch on search/filter change (debounced)
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchTransactions(1, true);
    }, 500);

    return () => clearTimeout(delayDebounce);
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
              className="space-y-5 max-h-[532px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600"
            >
              {transactions.map((txn) => (
                <li
                  key={txn._id}
                  className="flex items-center justify-between bg-gradient-to-tr from-white/60 to-slate-200/60 dark:from-slate-800/60 dark:to-slate-700/60 rounded-2xl px-6 py-4"
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
