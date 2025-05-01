import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";


const TransactionReminders = () => {
    const [reminders, setReminders] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        title: "",
        amount: "",
        category: "Others",
        date: "",
        isRecurring: false,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleAddReminder = (e) => {
        e.preventDefault();
        const newReminder = {
            id: Date.now(),
            ...form,
        };
        setReminders((prev) => [...prev, newReminder]);
        setForm({
            title: "",
            amount: "",
            category: "Others",
            date: "",
            isRecurring: false,
        });
        setShowForm(false); // close form after submit
    };

    return (
        <div className="mt-10 bg-gradient-to-br from-slate-50 to-white dark:from-[#0c0f1c] dark:to-[#1a1d2e] border border-slate-200 dark:border-slate-700 p-6 sm:p-8 md:p-10 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] transition-all overflow-x-hidden">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 tracking-tight">
                ⏰ Transaction Reminders
            </h3>

            {/* Reminders List */}
            {reminders.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-400">
                    <div className="text-5xl animate-pulse mb-2">🕒</div>
                    <p className="italic">No reminders yet. Add one below!</p>
                </div>
            ) : (
                <ul className="space-y-5 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent hover:scrollbar-thumb-purple-400 dark:hover:scrollbar-thumb-purple-500 overflow-x-hidden">
                    {reminders.map((reminder) => (
                        <li
                            key={reminder.id}
                            className="flex justify-between items-center bg-gradient-to-tr from-white/60 to-slate-100/60 dark:from-slate-800/60 dark:to-slate-700/60 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 shadow-lg hover:scale-[1.02] transition-all duration-300"
                        >
                            <div>
                                <p className="font-semibold text-slate-800 dark:text-white">{reminder.title}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {reminder.category} • {reminder.date}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-purple-600 dark:text-purple-400">₹{reminder.amount}</p>
                                {reminder.isRecurring && (
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400">Recurring</span>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* Toggle Button */}
            <div className="flex justify-center">
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-xl transition"
                >
                    {showForm ? "✖️ Cancel" : "➕ Add Reminder"}
                </button>
            </div>

            {/* Reminder Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.form
                        onSubmit={handleAddReminder}
                        className="space-y-4 mt-4"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                name="title"
                                placeholder="Reminder Title"
                                value={form.title}
                                onChange={handleChange}
                                required
                                className="px-4 py-2 rounded-lg bg-white/90 dark:bg-slate-800/80 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-600"
                            />
                            <input
                                type="number"
                                name="amount"
                                placeholder="Amount"
                                value={form.amount}
                                onChange={handleChange}
                                required
                                className="px-4 py-2 rounded-lg bg-white/90 dark:bg-slate-800/80 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-600"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <select
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                className="px-4 py-2 rounded-lg bg-white/90 dark:bg-slate-800/80 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-600"
                            >
                                <option value="Food">Food</option>
                                <option value="Entertainment">Entertainment</option>
                                <option value="Utilities">Utilities</option>
                                <option value="Travel">Travel</option>
                                <option value="Savings">Savings</option>
                                <option value="Others">Others</option>
                            </select>
                            <input
                                type="date"
                                name="date"
                                value={form.date}
                                onChange={handleChange}
                                required
                                className="px-4 py-2 rounded-lg bg-white/90 dark:bg-slate-800/80 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-600"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                name="isRecurring"
                                checked={form.isRecurring}
                                onChange={handleChange}
                                className="w-4 h-4"
                            />
                            <label htmlFor="isRecurring" className="text-slate-700 dark:text-slate-300">
                                Recurring Reminder
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2 rounded-xl transition w-full"
                        >
                            ✅ Save Reminder
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TransactionReminders;
