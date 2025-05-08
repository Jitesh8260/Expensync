import React, { useEffect, useState } from "react";
import axios from "axios";
import AddDebtForm from "./AddDebtForm";

const DebtOverview = () => {
    const [debts, setDebts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const token = localStorage.getItem("token");
    const API_URL = "http://localhost:5000/api/debts";

    useEffect(() => {
        const fetchDebts = async () => {
            try {
                const res = await axios.get(API_URL, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setDebts(res.data);
            } catch (err) {
                console.error("Error fetching debts:", err);
            }
        };
        fetchDebts();
    }, [token]);

    const totalDebt = debts.reduce((acc, curr) => acc + curr.amount, 0);

    const handleDebtAdded = (newDebt) => {
        setDebts((prevDebts) => [...prevDebts, newDebt]);
    };

    // ✅ Handle Delete
    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_URL}/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setDebts((prevDebts) => prevDebts.filter((debt) => debt._id !== id));
        } catch (error) {
            console.error("Error deleting debt:", error);
        }
    };

    return (
        <div className="mt-12">
            <h4 className="text-lg font-semibold mb-4">Debt Overview</h4>
            <div className="bg-red-50 dark:bg-slate-800 p-4 rounded-xl shadow border dark:border-slate-700">
                <p className="text-lg font-bold text-red-500 mb-4">Total Debt: ₹{totalDebt.toLocaleString()}</p>
                <ul className="space-y-2">
                    {debts.map((debt) => (
                        <li
                            key={debt._id}
                            className="flex justify-between items-center bg-white dark:bg-slate-700 px-4 py-2 rounded shadow"
                        >
                            <div>
                                <p className="font-medium">{debt.name}</p>
                                <p className="text-red-600 text-sm">₹{debt.amount.toLocaleString()}</p>
                            </div>
                            <button
                                onClick={() => handleDelete(debt._id)}
                                className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded"
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Add Debt Form */}
            <div className="mt-6">
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-xl transition"
                >
                    {showForm ? "✖️ Cancel" : "➕ Add Debt"}
                </button>

                {showForm && <AddDebtForm onDebtAdded={handleDebtAdded} />}
            </div>
        </div>
    );
};

export default DebtOverview;
