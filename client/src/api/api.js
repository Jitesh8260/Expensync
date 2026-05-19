import axios from "axios";
import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
} from "../utils/toast";
import { loaderControl } from "../utils/loaderControl";

const log = (...args) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};


const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

// Axios instance
const API = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor → add access token + loader start
API.interceptors.request.use((config) => {
  log("📡 [REQUEST]", config.method?.toUpperCase(), config.url, {
    params: config.params,
    data: config.data,
    skipLoader: config.skipLoader,
  });

  if (!config.skipLoader) {
    loaderControl.setLoading(true); // 👈 loader ON only if not skipped
  }

  const token = localStorage.getItem("token");
  if (
    token &&
    !config.url.includes("/auth/login") &&
    !config.url.includes("/auth/signup")
  ) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor → loader stop + handle expired access token
API.interceptors.response.use(
  (response) => {
    log("✅ [RESPONSE]", response.config.url, response.data);

    if (!response.config.skipLoader) {
      loaderControl.setLoading(false); // 👈 loader OFF only if not skipped
    }
    return response;
  },
  async (error) => {
    console.error("❌ [ERROR RESPONSE]", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });

    if (!error.config?.skipLoader) {
      loaderControl.setLoading(false); // 👈 loader OFF only if not skipped
    }

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token available");

        log("♻️ Refreshing access token...");

        // Get new access token
        const res = await axios.post(`${BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const newAccessToken = res.data.accessToken;
        localStorage.setItem("token", newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return API(originalRequest);
      } catch (err) {
        logoutUser();
        showInfoToast("Session expired. Please login again.");
        return Promise.reject(err);
      }
    }

    // Global error handling
    const msg =
      error.response?.data?.msg ||
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";
    showErrorToast(msg);

    return Promise.reject(error);
  }
);

//
// ✅ Backend check
//
export const checkBackend = async () => {
  log("🚀 Calling: checkBackend");
  try {
    const res = await API.get("/");
    log("✅ Backend API is running");
    return res.data;
  } catch (err) {
    console.error("❌ Backend error:", err.message);
    throw err;
  }
};


// ✅ Auth

export const loginUser = async (formData) => {
  log("🚀 Calling: loginUser", formData);
  try {
    const res = await API.post("/auth/login", formData);

    localStorage.setItem("token", res.data.accessToken);
    localStorage.setItem("refreshToken", res.data.refreshToken);

    showSuccessToast("Login Successful!");
    return res.data;
  } catch (error) {
    showErrorToast("Login Failed");
    throw error;
  }
};

export const logoutUser = () => {
  log("🚀 Logging out user...");
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  showInfoToast("Logged out successfully.");
  window.location.href = "/login";
};

export const signupUser = async (formData) => {
  log("🚀 Calling: signupUser", formData);
  try {
    const res = await API.post("/auth/signup", formData);
    showSuccessToast("Signup Successful! Please login.");
    return res.data;
  } catch (error) {
    showErrorToast("Signup Failed");
    throw error;
  }
};

//
// ✅ Transactions
//
export const getTransactions = async (
  page = 1,
  limit = 10,
  search = "",
  filter = ""
) => {
  log(
    `🚀 Calling: getTransactions | page=${page}, limit=${limit}, search="${search}", filter="${filter}"`
  );
  try {
    const res = await API.get("/transactions", {
      params: { page, limit, search, filter },
    });
    return res.data;
  } catch (error) {
    showErrorToast("Failed to fetch transactions");
    throw error;
  }
};

export const createTransaction = async (data) => {
  log("🚀 Calling: createTransaction", data);
  try {
    const res = await API.post("/transactions/create", data);
    showSuccessToast("Transaction added successfully!");
    notifyDataRefresh();
    return res.data;
  } catch (error) {
    showErrorToast("Failed to add transaction");
    throw error;
  }
};

export const getAllTransactionsForAnalytics = async () => {
  log("🚀 Calling: getAllTransactionsForAnalytics");
  try {
    const res = await API.get("/transactions/all");
    return res.data;
  } catch (error) {
    showErrorToast("Failed to fetch analytics transactions");
    throw error;
  }
};

export const deleteTransaction = async (id) => {
  log("🚀 Calling: deleteTransaction", id);
  try {
    const res = await API.delete(`/transactions/${id}`);
    showSuccessToast("Transaction deleted!");
    notifyDataRefresh();
    return res.data;
  } catch (error) {
    showErrorToast("Failed to delete transaction");
    throw error;
  }
};

const predictionCache = new Map();
const inFlightNLPRequests = new Map();

let insightsCache = null;
let insightsCacheTime = 0;
let inFlightInsightsPromise = null;

export const invalidatePredictionCache = (key) => {
  if (key) {
    predictionCache.delete(key.trim().toLowerCase());
  } else {
    predictionCache.clear();
  }
  insightsCache = null;
  insightsCacheTime = 0;
};

export const notifyDataRefresh = () => {
  predictionCache.clear();
  insightsCache = null;
  insightsCacheTime = 0;
  window.dispatchEvent(new CustomEvent("expensync_data_refresh"));
};

export const parseTransactionWithNLP = async (text, signal) => {
  log("🚀 Calling: parseTransactionWithNLP", text);
  if (!text || !text.trim()) return null;
  const cacheKey = text.trim().toLowerCase();
  
  if (predictionCache.has(cacheKey)) {
    log("⚡ [Cache] Returning cached prediction for:", cacheKey);
    return predictionCache.get(cacheKey);
  }

  // Deduplicate in-flight requests (React StrictMode protection)
  if (inFlightNLPRequests.has(cacheKey)) {
    log("⚡ [Dedupe] Joining in-flight request for:", cacheKey);
    return inFlightNLPRequests.get(cacheKey);
  }

  const requestPromise = (async () => {
    try {
      const res = await API.post("/ai/nlp-parse", { text }, { skipLoader: true, signal });
      predictionCache.set(cacheKey, res.data);
      if (predictionCache.size > 50) {
        const firstKey = predictionCache.keys().next().value;
        predictionCache.delete(firstKey);
      }
      return res.data;
    } catch (error) {
      if (error.name !== "CanceledError" && error.name !== "AbortError") {
        showErrorToast("Failed to parse AI text");
      }
      throw error;
    } finally {
      inFlightNLPRequests.delete(cacheKey);
    }
  })();

  inFlightNLPRequests.set(cacheKey, requestPromise);
  return requestPromise;
};

export const parseReceiptWithOCR = async (formData) => {
  log("🚀 Calling: parseReceiptWithOCR");
  try {
    const res = await API.post("/ai/ocr-parse", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error) {
    showErrorToast("Failed to parse receipt image");
    throw error;
  }
};

//
// ✅ Budgets
//
export const fetchBudgets = async () => {
  log("🚀 Calling: fetchBudgets");
  try {
    const res = await API.get("/budgets");
    return res.data;
  } catch (error) {
    showErrorToast("Failed to fetch budgets");
    throw error;
  }
};

export const addBudget = async (budgetData) => {
  log("🚀 Calling: addBudget", budgetData);
  try {
    const res = await API.post("/budgets", budgetData);
    showSuccessToast("Budget added successfully!");
    notifyDataRefresh();
    return res.data;
  } catch (error) {
    showErrorToast("Failed to add budget");
    throw error;
  }
};

//
// ✅ Debts
//
export const fetchDebts = async () => {
  log("🚀 Calling: fetchDebts");
  try {
    const res = await API.get("/debts");
    return res.data;
  } catch (error) {
    showErrorToast("Failed to fetch debts");
    throw error;
  }
};

export const addDebt = async (debtData) => {
  log("🚀 Calling: addDebt", debtData);
  try {
    const res = await API.post("/debts/create", debtData);
    showSuccessToast("Debt added successfully!");
    notifyDataRefresh();
    return res.data;
  } catch (error) {
    showErrorToast("Failed to add debt");
    throw error;
  }
};

export const deleteDebt = async (id) => {
  log("🚀 Calling: deleteDebt", id);
  try {
    const res = await API.delete(`/debts/${id}`);
    showSuccessToast("Debt deleted!");
    notifyDataRefresh();
    return res.data;
  } catch (error) {
    showErrorToast("Failed to delete debt");
    throw error;
  }
};

//
// ✅ Budget Summary
//
export const fetchBudgetSummary = async () => {
  log("🚀 Calling: fetchBudgetSummary");
  try {
    const res = await API.get("/summary");
    return res.data;
  } catch (error) {
    showErrorToast("Failed to fetch budget summary");
    throw error;
  }
};

//
// ✅ Category Goals (skip loader)
//
export const fetchCategoryGoals = async () => {
  log("🚀 Calling: fetchCategoryGoals");
  try {
    const res = await API.get("/category-goals", { skipLoader: true });
    return res.data;
  } catch (error) {
    showErrorToast("Failed to fetch category goals");
    throw error;
  }
};

export const setCategoryGoals = async (categoryGoals, monthlySavingsGoal) => {
  log("🚀 Calling: setCategoryGoals", categoryGoals, monthlySavingsGoal);
  try {
    const res = await API.post(
      "/category-goals/set",
      { categoryGoals, monthlySavingsGoal },
      { skipLoader: true }
    );
    showSuccessToast("Category goals updated!");
    notifyDataRefresh();
    return res.data;
  } catch (error) {
    showErrorToast("Failed to set category goals");
    throw error;
  }
};

//
// ✅ Reminders (skip loader)
//
export const fetchReminders = async () => {
  log("🚀 Calling: fetchReminders");
  try {
    const res = await API.get("/reminders", { skipLoader: true });
    return res.data;
  } catch (error) {
    showErrorToast("Failed to fetch reminders");
    throw error;
  }
};

export const addReminder = async (data) => {
  log("🚀 Calling: addReminder", data);
  try {
    const res = await API.post("/reminders/create", data, { skipLoader: true });
    showSuccessToast("Reminder added successfully!");
    notifyDataRefresh();
    return res.data;
  } catch (error) {
    showErrorToast("Failed to add reminder");
    throw error;
  }
};

export const deleteReminder = async (id) => {
  log("🚀 Calling: deleteReminder", id);
  try {
    const res = await API.delete(`/reminders/${id}`, { skipLoader: true });
    showSuccessToast("Reminder deleted!");
    notifyDataRefresh();
    return res.data;
  } catch (error) {
    showErrorToast(
      error.response?.data?.msg ||
      error.response?.data?.message ||
      "Failed to delete reminder"
    );
    throw error;
  }
};

export const getSpendingPredictions = async (months = 6) => {
  log("🚀 Calling: getSpendingPredictions", months);
  try {
    const res = await API.get("/ml/predict-spending", { params: { months }, skipLoader: true });
    return res.data;
  } catch (error) {
    console.error("Failed to fetch ML spending predictions:", error);
    return null;
  }
};

export const getFinancialInsights = async (months = 6, forceRefresh = false) => {
  log("🚀 Calling: getFinancialInsights", months);
  if (!forceRefresh && insightsCache && Date.now() - insightsCacheTime < 60000) {
    return insightsCache;
  }

  if (inFlightInsightsPromise) {
    return inFlightInsightsPromise;
  }

  inFlightInsightsPromise = (async () => {
    try {
      const res = await API.get("/ml/financial-insights", { params: { months }, skipLoader: true });
      insightsCache = res.data;
      insightsCacheTime = Date.now();
      return res.data;
    } catch (error) {
      console.error("Failed to fetch ML financial insights:", error);
      return null;
    } finally {
      inFlightInsightsPromise = null;
    }
  })();

  return inFlightInsightsPromise;
};

export default API;
