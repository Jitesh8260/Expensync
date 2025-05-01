const BASE_URL = "http://localhost:5000/api";

export const getTransactions = async (userId) => {
  const res = await fetch(`${BASE_URL}/transactions/${userId}`);
  return res.json();
};

export const createTransaction = async (data) => {
  const res = await fetch(`${BASE_URL}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};


export const fetchBudgets = async (userId) => {
  const res = await fetch(`${BASE_URL}/budgets/${userId}`);
  return res.json();
};

export const addBudget = async (budgetData) => {
  const res = await fetch(`${BASE_URL}/budgets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(budgetData),
  });
  return res.json();
};
