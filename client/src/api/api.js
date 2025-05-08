const BASE_URL = "http://localhost:5000/api";
import axios from "axios";

// Get token from localStorage
const getToken = () => localStorage.getItem("token");

// Helper for headers
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// Helper to handle response errors
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorText;
    try {
      errorText = await response.text();
    } catch (e) {
      errorText = "Unable to parse error response";
    }
    console.error("Error response text:", errorText);
    throw new Error("Request failed");
  }
  return response.json();
};

// ✅ GET Transactions - userId not required
export const getTransactions = async () => {
  try {
    const response = await fetch(`${BASE_URL}/transactions`, {
      headers: authHeaders(),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error("Error fetching transactions:", error.message);
    throw error;
  }
};

// ✅ POST Create Transaction
export const createTransaction = async (data) => {
  try {
    const res = await fetch(`${BASE_URL}/transactions/create`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
};

// ✅ GET Budgets
export const fetchBudgets = async () => {
  try {
    const res = await fetch(`${BASE_URL}/budgets`, {
      headers: authHeaders(),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    throw error;
  }
};

// ✅ POST Add Budget
export const addBudget = async (budgetData) => {
  try {
    const res = await fetch(`${BASE_URL}/budgets`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(budgetData),
    });
    return await handleResponse(res);
  } catch (error) {
    console.error("Error adding budget:", error);
    throw error;
  }
};
