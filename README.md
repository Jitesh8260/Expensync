# 📊 Expensync — Smart AI-Powered Personal Finance Tracker

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status: Active](https://img.shields.io/badge/Status-Active-brightgreen.svg)]()
[![Stack: MERN + Flask](https://img.shields.io/badge/Stack-MERN%20%2B%20Flask-blue.svg)]()
[![Production Ready](https://img.shields.io/badge/Production-Ready-orange.svg)]()

**Expensync** is a full-stack, production-hardened personal finance and expense tracking application built using the MERN stack (MongoDB, Express.js, React, Node.js) paired with a specialized Python Flask Machine Learning microservice. The platform helps users monitor their financial health, track transactions, set category-specific budgets, parse receipt text dynamically, and forecast spending habits with real-time feedback.

👉 **Live Demo**: [https://expensyncj17.vercel.app](https://expensyncj17.vercel.app/)

---

## 🌟 Visual Preview & Layout

### 🖥️ Dashboard Showcase
![Expensync Full Demo](./public/Dashboard.png)

### 🌞 Light Mode | 🌙 Dark Mode
| Light Theme Layout | Dark Theme Layout |
| :--- | :--- |
| ![Light](./public/light.png) | ![Dark](./public/dark.png) |

---

## 🚀 Key Features

*   🔐 **Secure Dual-Token Auth** — Stateless JWT authentication flow with automatic silent Access Token refresh interceptors.
*   🧠 **Behavioral AI Financial Insights** — Dynamic assessment of **Financial Health Score** and **Safe Spending Capacity** driven by category budgeting and recent transactional velocity.
*   📈 **Smart Forecasting** — Linear Regression spending models forecasting next-month categorical expenses.
*   🏷️ **KNN Category Classifier** — Autocompletion and suggestion of categories based on historical transaction titles and contextual merchant normalization.
*   💾 **Adaptive Learning Memory** — Store merchant classification corrections locally to improve autocompletion over time.
*   📝 **Smart Input NLP Parser** — Enter transactions in plain English (e.g. *"$45 for pizza yesterday at Dominoes"*) and let the parser extract title, amount, category, and date.
*   🧾 **OCR Receipt Scanner** — Upload images of receipts to automatically extract transaction details via Tesseract.js.
*   📊 **Premium Analytics & Visualizations** — Highly responsive Pie and Doughnut visualizations comparing category allocations and income-to-expense ratios.
*   ⏰ **Obligations Tracker** — Live scheduler for upcoming, recurring reminders, and debt accounts.
*   📱 **Responsive Mobile-First UI** — Fully adaptive dark/light glassmorphic layout using Tailwind CSS.

---

## 🛠️ Technology Stack

*   **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Chart.js, Lucide Icons.
*   **Backend**: Node.js, Express.js, JWT, Mongoose, Helmet (Security Headers), Express Rate Limit (Brute Force Protection).
*   **ML Microservice**: Python, Flask, Scikit-Learn (KNN Classifier, Linear Regression), PyMongo.
*   **Database**: MongoDB Atlas (Cloud NoSQL).
*   **Hosting**: Vercel (Frontend), Render (Backend & ML Service).

---

## 📦 System Architecture Diagram

```mermaid
graph TD
    Client[React Frontend / Vite] <-->|HTTPS / JSON + JWT| API[Express API Server]
    API <-->|Mongoose ORM| DB[(MongoDB Atlas)]
    API <-->|HTTP / JSON + 2s Timeout| ML[Flask ML Service]
    ML <-->|PyMongo Read-only| DB
```

---

## 📂 Project Structure

```markdown
Expensync/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── api/            # Centralized Axios Client & Interceptors
│   │   ├── components/     # Reusable UI & Layout Components
│   │   ├── context/        # Theme & Global Spinner Context
│   │   └── pages/          # Home, Login, Signup, Landing
│   └── vercel.json         # Vercel SPA Routing Configuration
├── server/                 # Express API Backend
│   ├── controllers/        # Business Logic Modules
│   ├── middleware/         # Auth, Upload, Validation Middlewares
│   ├── models/             # Mongoose Database Schemas
│   ├── routes/             # REST Route Groupings
│   └── index.js            # Server Bootstrapper & Middleware Setup
├── ml-service/             # Flask Machine Learning Backend
│   ├── services/           # KNN Predictor, Linear Forecast, Insights Engines
│   ├── utils/              # Configuration & Environment Adapters
│   └── app.py              # Flask Route Controllers
```

---

## ⚙️ Environment Configuration

Set up environment variables in their respective project subdirectories.

### Client Environment Setup (`client/.env`)
Create `client/.env` based on `client/.env.example`:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

### Server Environment Setup (`server/.env`)
Create `server/.env` based on `server/.env.example`:
```env
PORT=5000
MONGO_URI=mongodb+srv://your_user:your_password@your_cluster.mongodb.net/financeTracker
JWT_SECRET=your_jwt_access_secret_key
REFRESH_TOKEN_SECRET=your_jwt_refresh_secret_key
ML_SERVICE_URL=http://localhost:5050
ALLOWED_ORIGIN=http://localhost:5173
```

### ML Service Environment Setup (`ml-service/.env`)
Create `ml-service/.env` based on `ml-service/.env.example`:
```env
ML_PORT=5050
MONGO_URI=mongodb+srv://your_user:your_password@your_cluster.mongodb.net/financeTracker
```

---

## 🚀 Local Installation & Development

### 1. Prerequisites
Ensure you have the following installed locally:
- **Node.js** (v16.x or newer)
- **Python** (v3.9.x or newer)
- A running MongoDB instance (or Atlas account)

### 2. Set Up the Express Server
```bash
cd server
npm install
npm run dev
```

### 3. Set Up the ML Microservice
```bash
cd ml-service
# Linux/macOS:
python3 -m venv venv
source venv/bin/activate
# Windows:
# python -m venv venv
# venv\Scripts\activate

pip install -r requirements.txt
python app.py
```

### 4. Set Up the Client App
```bash
cd client
npm install
npm run dev
```
Open your browser to: **`http://localhost:5173`**

---

## 🔐 Security & Production Hardening

The application is structured to meet core industry security and stability guidelines:
1.  **CORS Origin Restrictions**: Only configured domains (e.g., Vercel host) are authorized to exchange data.
2.  **Helmet Security Headers**: Protection against cross-site scripting (XSS), clickjacking, and mime-sniffing.
3.  **JSON Payload Limits**: Enforced `10mb` cap on uploads to prevent memory depletion exploits.
4.  **Network Resilience**: Front-end requests are equipped with a `15-second` network timeout; server calls to the Flask microservice use a `2-second` circuit-breaking timeout with automated fallback to mathematical calculations if the ML node goes offline.
5.  **Brute-Force Rate Limiting**: Max 5 sign-in attempts per 15-minute window per IP.

---

## 🗄️ Database Schema & Collections Overview

The application utilizes six MongoDB collections modeled via Mongoose to maintain relational constraints:

*   **`users`**: Contains account identities, hashed passwords (`bcryptjs`), and active JWT refresh tokens.
*   **`transactions`**: The core ledger holding date, title, amount (negatives represent expenses), category, tag arrays, and user owner association.
*   **`budgets`**: Defines monthly category-specific spending caps and overall savings targets.
*   **`reminders`**: Scheduled transactions tracking recurring billing events.
*   **`debts`**: Outstanding loans or balances owed.
*   **`merchantrules`**: Tracks custom classifications created by the user, powering the adaptive category-matching memory.

---

## 🚢 Production Deployment Guide

### A. Frontend to Vercel
1. Select the `/client` directory in the repository during importing.
2. Set the build framework to **Vite**.
3. Add Environment Variable: `VITE_API_URL` pointing to your Express API server.
4. Deployment completes automatically; routing fallbacks are pre-configured inside `vercel.json`.

### B. Express Backend to Render
1. Select the `/server` directory.
2. Set the Environment to **Node**.
3. Use the build command `npm install`.
4. Use the start command `npm start`.
5. Map env variables: `MONGO_URI`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `ALLOWED_ORIGIN` (your Vercel link), and `ML_SERVICE_URL` (your Render ML link).

### C. Flask ML Microservice to Render
1. Select the `/ml-service` directory.
2. Set the Environment to **Python**.
3. Use the build command `pip install -r requirements.txt`.
4. Use the start command `gunicorn app:app`.
5. Map env variables: `MONGO_URI` and `ML_PORT`.

---

## 🔮 Future Roadmap
*   📉 **Advanced Portfolio Analytics**: Asset allocation tracking and investment returns integration.
*   🏦 **Real-Time Bank Syncing**: Secure bank connection via Plaid API for automated ledger updates.
*   💳 **Smart Bill Splitting**: Group split calculation and peer reminders.

---

## 👨‍💻 Author & Credits

*   **Jitesh Bhakat** (Creator & Full-stack Architect)
    *   GitHub: [Jitesh8260](https://github.com/Jitesh8260)
    *   LinkedIn: [Jitesh Kumar](https://www.linkedin.com/in/jitesh-kumar-2521b7249/)

---

⭐ **If you found Expensync helpful, please consider starring the repository!** ⭐
