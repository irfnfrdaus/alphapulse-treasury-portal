# AlphaPulse: Enterprise Multi-Currency Treasury & Liquidity Portal

![Architecture](https://img.shields.io/badge/Architecture-Full--Stack_REST_API-0F2C59?style=for-the-badge&logo=react)
![Frontend](https://img.shields.io/badge/Frontend-React_18_%7C_Vite_%7C_Tailwind-2563EB?style=for-the-badge&logo=tailwindcss)
![Backend](https://img.shields.io/badge/Backend-Node.js_%7C_Express-10B981?style=for-the-badge&logo=nodedotjs)
![Database](https://img.shields.io/badge/Database-SQLite_Embedded_Engine-F59E0B?style=for-the-badge&logo=sqlite)
![Compliance](https://img.shields.io/badge/Governance-BNM_RMiT_Dual--Control-6366F1?style=for-the-badge&logo=shield)

**AlphaPulse** is a production-grade enterprise treasury operations and liquidity intelligence platform engineered for corporate conglomerates, commercial banks, and multinational finance hubs. It bridges high-throughput financial engineering, automated multi-currency cash pooling, macroeconomic volatility stress-testing, and regulatory dual-signoff controls.

Developed by **Muhammad Irfan Firdaus** (UTP B.IT Hons, Major in Big Data Analytics, Minor in Financial Management).

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                      CLIENT TIER (React 18 + Vite)                     │
│  • Executive Liquidity Cockpit         • 12M Rolling Cash Forecaster   │
│  • FX Sensitivity & Stress Test Engine  • Dual-Control Approval UI      │
│  • Multi-Currency Cash Pools (MYR/USD) • BNM RMiT Audit Trail          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / RESTful JSON
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   BACKEND TIER (Node.js 24 + Express)                  │
│  • Cross-Rate FX Engine                • Dual-Signoff State Machine    │
│  • Working Capital & Solvency Metrics  • Transaction Validation Logic  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Native High-Throughput I/O
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               DATA TIER (Node Native Embedded SQLite Engine)           │
│  • accounts (Multi-Currency Balances)  • transactions (Ledger)         │
│  • fx_rates (Live Spreads & Vol)       • hedging_contracts (Forwards)  │
│  • audit_logs (Immutable BNM Compliance Event Stream)                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Functional Capabilities

### 1. Global Multi-Currency Liquidity Consolidation
* Real-time mark-to-market translation of cross-border cash accounts across **MYR**, **USD**, **SGD**, and **EUR** (Maybank Islamic, CIMB, J.P. Morgan Chase, Citibank, DBS, BNP Paribas).
* Automated computation of **Net Global Liquidity** (~RM 68.3M), **Cash Ratio** (4.81x), and **Quick Ratio** (5.29x) exceeding standard loan covenant thresholds (1.50x).

### 2. 12-Month Rolling Cash Flow Projection & Buffer Defense
* Projected operating inflows vs. CapEx disbursements across a 12-month horizon.
* Tracks cumulative cash trajectory against a hard **RM 25.0M Solvency Operating Floor** to prevent working capital exhaustion.

### 3. Dynamic FX Volatility & Macroeconomic Stress-Testing Engine
* Interactive multi-factor stress simulation:
  * **USD/MYR Currency Shocks:** Range from -15% (MYR appreciation) to +15% (USD surge).
  * **Overnight Policy Rate (OPR) Shocks:** Range from -100 bps to +200 bps.
* Computes real-time translation delta on unhedged overseas balances and annual interest expense/income variances.

### 4. Dual-Control Segregation of Duties (BNM RMiT Policy)
* Enforces strict Maker-Checker controls:
  * **Treasury Analysts** initiate intercompany sweeps, FX conversions, and supplier disbursements.
  * **Group CFO / Authorized Signatories** review and execute cryptographic approval, triggering an atomic transaction that settles cross-currency balances.

### 5. Active Hedging & Derivative Portfolio Oversight
* Direct tracking of **FX Forward Contracts**, **Cross-Currency Swaps**, and **Zero-Cost Collars**.
* Live MTM (Mark-to-Market) valuation tracking strike vs. spot differentials.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide React, JetBrains Mono typography |
| **Backend** | Node.js 24 runtime, Express.js REST API, CORS middleware |
| **Database** | Node built-in `node:sqlite` embedded engine (ACID compliant, zero-lag) |
| **Deployment** | 1-Click Windows Batch launcher (`run_alphapulse.bat`), dual concurrent daemons |

---

## 📦 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status and uptime |
| `GET` | `/api/overview` | Executive consolidated liquidity, ratios, currency allocation |
| `GET` | `/api/accounts` | Complete listing of multi-currency institutional accounts |
| `GET` | `/api/fx-rates` | Live exchange rates, 24h spreads, and 30-day volatility |
| `GET` | `/api/forecasting` | 12-month rolling cash flow projection dataset |
| `POST` | `/api/stress-test` | Macroeconomic simulation engine (USD shock + rate shift) |
| `GET` | `/api/transactions` | Query ledger transactions with optional status filtering |
| `POST` | `/api/transactions` | Queue new cross-border transfer / FX conversion |
| `POST` | `/api/transactions/:id/approve` | CFO dual-control signoff & balance settlement |
| `GET` | `/api/hedges` | Active derivative contracts & MTM gains/losses |
| `GET` | `/api/audit-trail` | BNM RMiT-compliant immutable event log |

---

## 🏃 Quick Start Guide

### 1. Prerequisites
* Node.js v20+ or v24+ installed
* npm v10+

### 2. 1-Click Launch (Windows)
Double-click `run_alphapulse.bat` in the root folder. It will:
1. Boot the unified server (React Frontend + Node.js REST API) on `http://localhost:5050`
2. Launch your browser automatically to `http://localhost:5050`.

### 3. Manual Launch
```bash
# Terminal 1: Backend
cd server
npm install
npm start

# Terminal 2: Frontend
cd client
npm install
npm run dev
```

---

## 👨‍💻 Author
**Muhammad Irfan Firdaus bin Noorhisam**  
* Universiti Teknologi PETRONAS (UTP) – B.IT (Hons) Major in Data Analytics, Minor in Financial Management (CGPA: 3.72)
* Former IT QA Intern @ Hilti Asia IT Services
* LinkedIn: [linkedin.com/in/irfan-firdaus-34a859338](https://linkedin.com/in/irfan-firdaus-34a859338)
* GitHub: [github.com/irfnfrdaus](https://github.com/irfnfrdaus)
