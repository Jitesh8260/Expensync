import React, { useState } from "react";
import { createTransaction } from "../api/api"; // Importing the API function

const tagsList = ["Essential", "Urgent", "Recurring", "Online", "Cash", "Credit"];

const AddTransaction = ({ userId, onSuccess }) => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Others");
  const [note, setNote] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Function to handle tag selection
  const handleTagChange = (tag) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tag)
        ? prevTags.filter((t) => t !== tag)
        : [...prevTags, tag]
    );
  };

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !amount) return;

    const transactionData = {
      title: name,
      amount: parseInt(amount),
      category,
      note,
      tags: selectedTags,
      date,
      userId,
    };

    try {
      await createTransaction(transactionData); // Calling the API function
      setName(""); // Reset form fields after successful submission
      setAmount("");
      setCategory("Others");
      setNote("");
      setSelectedTags([]);
      setDate(new Date().toISOString().split("T")[0]);
      onSuccess(); // Trigger onSuccess callback (e.g., closing the form)
    } catch (error) {
      alert("Error creating transaction. Please try again.");
    }
  };

  return (
    <div className="mt-10 max-w-3xl mx-auto p-8 rounded-3xl shadow-2xl bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 transition-all duration-500 relative">
      <button
        onClick={onSuccess}
        className="absolute top-4 right-4 text-slate-500 hover:text-red-500 text-xl font-bold"
      >
        ✕
      </button>

      <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-8 tracking-tight">
        💳 Add Transaction
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row: Title & Amount */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Title
            </label>
            <input
              type="text"
              placeholder="e.g. Grocery Shopping"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Amount
            </label>
            <input
              type="number"
              placeholder="e.g. -500 for expense"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-white"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        {/* Row: Category & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Category
            </label>
            <select
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-white"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Food">Food</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Travel">Travel</option>
              <option value="Utilities">Utilities</option>
              <option value="Income">Income</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Date
            </label>
            <input
              type="date"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-white"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
            Note (optional)
          </label>
          <textarea
            rows="3"
            placeholder="e.g. Bought vegetables and fruits"
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-white"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-3">
            {tagsList.map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => handleTagChange(tag)}
                className={`px-3 py-1 rounded-full border text-sm transition-all ${
                  selectedTags.includes(tag)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-transparent border-slate-400 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-lg shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
          >
            ➕ Add Transaction
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTransaction;
