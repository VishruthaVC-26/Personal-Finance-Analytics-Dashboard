# Personal Finance Analytics Dashboard

A full-stack web application that helps users track, analyze, and visualize their personal finances.

## Features

- **Authentication** — Register, login, logout with JWT + HTTP-only cookies
- **Transactions** — Add, edit, delete income and expenses with categories
- **Dashboard** — KPI cards, income vs expense chart, category donut, budget progress, insights
- **Budgets** — Category spending limits with utilization tracking and status warnings
- **Savings Goals** — Create goals, track progress, quick amount updates
- **Analytics** — Monthly trends, cash flow, savings rate, top categories
- **Reports** — Monthly report view + CSV export
- **Search & Filters** — By date, type, category, amount, keyword
- **Settings** — Profile, password, custom categories, data export
- **Seed Data** — Demo account with 6 months of sample transactions

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS, Recharts  |
| Backend   | Node.js, Express.js                     |
| Database  | SQLite (via better-sqlite3)             |
| Auth      | JWT, bcrypt, HTTP-only cookies          |

## Prerequisites

- Node.js 18+
- npm

## Quick Start

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Seed Demo Data (optional)

```bash
npm run seed
```

This creates a demo user: **demo@pfd.com** / **demo123** with sample transactions, budgets, and goals.

### 3. Start Backend

```bash
npm run dev
```

API runs at `http://localhost:5000`

### 4. Install Frontend Dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

### 5. Start Frontend

```bash
npm run dev
```

App runs at `http://localhost:5173`

## Demo Credentials

```
Email:    demo@pfd.com
Password: demo123
```

## Project Structure

```
personal-finance-dashboard/
├── backend/
│   ├── config/
│   │   └── db.js              # SQLite connection + schema init
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── transactionController.js
│   │   ├── categoryController.js
│   │   ├── budgetController.js
│   │   ├── goalController.js
│   │   ├── analyticsController.js
│   │   └── reportController.js
│   ├── middleware/
│   │   └── auth.js            # JWT verification
│   ├── routes/
│   │   ├── auth.js
│   │   ├── transactions.js
│   │   ├── categories.js
│   │   ├── budgets.js
│   │   ├── goals.js
│   │   ├── analytics.js
│   │   └── reports.js
│   ├── utils/
│   │   ├── helpers.js         # ID gen, hashing, JWT
│   │   ├── calculations.js    # KPIs, insights, progress
│   │   └── csv.js             # CSV import/export
│   ├── database/
│   │   └── seed.js            # Demo data seeder
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/        # Recharts wrappers
│   │   │   ├── KPICard.jsx
│   │   │   ├── TransactionTable.jsx
│   │   │   ├── TransactionForm.jsx
│   │   │   ├── BudgetProgress.jsx
│   │   │   └── EmptyState.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── layouts/
│   │   │   └── Layout.jsx     # Sidebar + header
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Transactions.jsx
│   │   │   ├── Budgets.jsx
│   │   │   ├── Goals.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── Reports.jsx
│   │   │   └── Settings.jsx
│   │   ├── services/
│   │   │   ├── api.js         # Axios instance
│   │   │   └── index.js       # API service methods
│   │   ├── utils/
│   │   │   └── formatters.js  # Currency, date helpers
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── database/
│   └── schema.sql             # Full DB schema reference
│
└── README.md
```

## API Endpoints

### Auth
| Method | Endpoint              | Description         |
|--------|-----------------------|---------------------|
| POST   | /api/auth/register    | Create account      |
| POST   | /api/auth/login       | Login               |
| POST   | /api/auth/logout      | Logout              |
| GET    | /api/auth/profile     | Get profile         |
| PUT    | /api/auth/profile     | Update profile      |
| PUT    | /api/auth/password    | Change password     |

### Transactions
| Method | Endpoint                  | Description          |
|--------|---------------------------|----------------------|
| GET    | /api/transactions         | List (with filters)  |
| POST   | /api/transactions         | Create               |
| GET    | /api/transactions/:id     | Get one              |
| PUT    | /api/transactions/:id     | Update               |
| DELETE | /api/transactions/:id     | Delete               |

### Categories
| Method | Endpoint                 | Description   |
|--------|--------------------------|---------------|
| GET    | /api/categories          | List          |
| POST   | /api/categories          | Create        |
| PUT    | /api/categories/:id      | Update        |
| DELETE | /api/categories/:id      | Delete        |

### Budgets
| Method | Endpoint              | Description   |
|--------|-----------------------|---------------|
| GET    | /api/budgets          | List + spent  |
| POST   | /api/budgets          | Create        |
| PUT    | /api/budgets/:id      | Update        |
| DELETE | /api/budgets/:id      | Delete        |

### Goals
| Method | Endpoint           | Description   |
|--------|--------------------|---------------|
| GET    | /api/goals         | List + %      |
| POST   | /api/goals         | Create        |
| PUT    | /api/goals/:id     | Update        |
| DELETE | /api/goals/:id     | Delete        |

### Analytics
| Method | Endpoint                  | Description        |
|--------|---------------------------|--------------------|
| GET    | /api/analytics/summary    | KPI summary        |
| GET    | /api/analytics/monthly    | Monthly totals     |
| GET    | /api/analytics/categories | Category breakdown |
| GET    | /api/analytics/cash-flow  | Cash flow data     |
| GET    | /api/analytics/savings    | Savings trend      |
| GET    | /api/analytics/insights   | Rule-based insights|

### Reports
| Method | Endpoint                        | Description       |
|--------|---------------------------------|-------------------|
| GET    | /api/reports/monthly            | Monthly report    |
| GET    | /api/reports/monthly.csv        | Monthly CSV       |
| GET    | /api/reports/transactions.csv   | Transactions CSV  |

## Financial Formulas

```
Net Savings      = Total Income - Total Expenses
Savings Rate     = (Net Savings / Total Income) × 100
Avg Monthly Exp  = Total Expenses / Number of Months
Budget Use %     = (Amount Spent / Budget Limit) × 100
Goal Progress %  = (Current Amount / Target Amount) × 100
MoM Change %     = ((Current - Previous) / Previous) × 100
```

## Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens in HTTP-only cookies (7-day expiry)
- All queries scoped to authenticated user ID
- Input validation on all endpoints
- Parameterized SQL queries (no injection)

## License

Built for academic / personal project use.
