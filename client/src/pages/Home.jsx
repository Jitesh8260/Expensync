import Dashboard from "../components/Dashboard";
import { useState } from "react";

function Home() {
  const [transactions] = useState([]);

  const totalIncome = transactions
    .filter((txn) => txn.amount > 0)
    .reduce((acc, txn) => acc + txn.amount, 0);

  const totalExpense = transactions
    .filter((txn) => txn.amount < 0)
    .reduce((acc, txn) => acc + Math.abs(txn.amount), 0);

  return (
    <div className="">
      <Dashboard totalIncome={totalIncome} totalExpense={totalExpense} />
    </div>
  );
}

export default Home;
