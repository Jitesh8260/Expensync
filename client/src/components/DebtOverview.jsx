const DebtOverview = ({ debts = [] }) => {
    const totalDebt = debts.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="mt-12">
            <h4 className="text-lg font-semibold mb-4">Debt Overview</h4>
            <div className="bg-red-50 dark:bg-slate-800 p-4 rounded-xl shadow border dark:border-slate-700">
                <p className="text-lg font-bold text-red-500 mb-2">Total Debt: ₹{totalDebt.toLocaleString()}</p>
                <ul className="space-y-1">
                    {debts.map((debt, idx) => (
                        <li key={idx} className="flex justify-between text-sm">
                            <span>{debt.name}</span>
                            <span className="text-red-600">₹{debt.amount.toLocaleString()}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default DebtOverview;
