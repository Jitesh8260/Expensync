const BudgetGoalProgress = ({ goals = [] }) => {
    return (
        <div className="mt-5">
            <h4 className="text-lg font-semibold mb-4">Budget Goal Progress</h4>
            <div className="space-y-4">
                {goals.map(({ category, goal, spent }, idx) => {
                    const percentage = Math.min((spent / goal) * 100, 100);
                    const isOver = spent > goal;

                    return (
                        <div key={idx}>
                            <div className="flex justify-between mb-1">
                                <span className="font-medium text-sm">{category}</span>
                                <span className="text-sm">₹{spent} / ₹{goal}</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                                <div
                                    className={`h-3 rounded-full transition-all duration-700 ease-out ${isOver ? "bg-red-500" : "bg-green-500"}`}
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BudgetGoalProgress;
