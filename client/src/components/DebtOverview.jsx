import { useEffect, useState } from "react";
import AddDebtForm from "./AddDebtForm";
import { fetchDebts } from "../api/api"; // centralized api.js function
import { deleteDebt } from "../api/api"; // add this function in api.js

const DebtOverview = () => {
    const [debts, setDebts] = useState([]);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        const getDebts = async () => {
            try {
                const data = await fetchDebts(); // centralized API call
                setDebts(data);
            } catch (err) {
                console.error("Error fetching debts:", err);
            }
        };
        getDebts();
    }, []);

    const totalDebt = debts.reduce((acc, curr) => acc + curr.amount, 0);

    const handleDebtAdded = (newDebt) => {
        setDebts((prevDebts) => [...prevDebts, newDebt]);
    };

    const handleDelete = async (id) => {
        try {
            await deleteDebt(id); // centralized API call
            setDebts((prevDebts) => prevDebts.filter((debt) => debt._id !== id));
        } catch (err) {
            console.error("Error deleting debt:", err);
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
