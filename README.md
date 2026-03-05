# 💰 FinTrack - Personal Finance Tracker

A full-stack personal finance management web application that helps users track expenses, manage income, set monthly budgets, and visualize spending patterns.

**Live Demo:** [https://personal-finance-tracker-tau-silk.vercel.app](https://personal-finance-tracker-tau-silk.vercel.app)

## 📸 Screenshots

> Login/Register
<img width="1080" height="680" alt="Screenshot 2026-03-03 at 4 28 49 PM" src="https://github.com/user-attachments/assets/ab3fc429-f0c5-4534-803d-de5c807a972b" />

> Dashboard
<img width="1080" height="680" alt="Screenshot 2026-03-03 at 4 29 55 PM" src="https://github.com/user-attachments/assets/16f28f5a-ef8c-4334-a332-236ab42efb94" />

> Income
<img width="1080" height="680" alt="Screenshot 2026-03-03 at 4 30 22 PM" src="https://github.com/user-attachments/assets/f6612a0b-9a2d-4e8a-953e-8d6a97cd6677" />

> Budgets
<img width="1080" height="680" alt="Screenshot 2026-03-03 at 4 30 56 PM" src="https://github.com/user-attachments/assets/684813e6-9edb-4af1-8f1f-59e151dafe9d" />

Transactions
> <img width="1080" height="680" alt="Screenshot 2026-03-03 at 4 31 24 PM" src="https://github.com/user-attachments/assets/32cc0d81-9722-467a-be23-2e41771f5fa8" />


## 🚀 Features

### 🔐 Authentication

- Secure user registration and login
- JWT-based authentication
- Protected routes — all pages require login
- Auto logout on token expiry

### 📊 Dashboard

- Monthly summary cards — Total Income, Total Expenses, Net Balance, Savings Rate
- Add expense form with category, amount, date and description
- Category breakdown with visual progress bars
- Budget progress overview with color-coded indicators
- Recent transactions (latest 5, both income and expenses)
- Month picker to view any past month's data

### 💵 Income Management

- Add income with source, amount, frequency and date
- Supported sources: Salary, Freelance, Bonus, Investment, Business, Rental, Other
- Frequency options: Monthly, Weekly, One-time, Yearly
- Income source breakdown with visual bars
- Paginated income history with delete option

### 🎯 Budget Setting & Tracking

- Set monthly spending limits per category
- Real-time progress bars showing actual vs budgeted spend
- Color-coded indicators:
  - 🟢 Green — Under 70% (on track)
  - 🟡 Yellow — 70–90% (approaching limit)
  - 🔴 Red — Above 90% (at or over limit)
- Budget visible on both Dashboard and dedicated Budgets page
- Delete budget option

### 📋 Transaction History

- Combined view of all expenses and income sorted by date
- Filter by Type (Expense / Income)
- Filter by Category (for expenses)
- Filter by Month
- Search by description or source
- Paginated results (10 per page)
- Delete individual transactions

## 🛠 Tech Stack

### Frontend

| Technology         | Usage               |
| ------------------ | ------------------- |
| HTML5              | Page structure      |
| CSS3               | Styling and layout  |
| Vanilla JavaScript | Logic and API calls |
| Vercel             | Hosting             |

### Backend

| Technology | Usage                 |
| ---------- | --------------------- |
| Node.js    | Runtime               |
| Express.js | Web framework         |
| JWT        | Authentication        |
| bcryptjs   | Password hashing      |
| CORS       | Cross-origin handling |
| Render     | Hosting               |

### Database

| Technology | Usage                  |
| ---------- | ---------------------- |
| MySQL      | Relational database    |
| Railway    | Cloud database hosting |

---

```
## 📁 Project Structure

Finance-Tracker/
├── frontend/
│ ├── index.html \# Login / Register page
│ ├── dashboard.html \# Main dashboard
│ ├── transactions.html \# Transaction history
│ ├── income.html \# Income management
│ ├── budget.html \# Budget management
│ ├── css/
│ │ ├── style.css \# Global styles
│ │ ├── auth.css \# Auth page styles
│ │ └── dashboard.css \# App layout styles
│ └── js/
│ ├── auth.js \# Login/register logic
│ ├── dashboard.js \# Dashboard logic
│ ├── transaction.js \# Transactions logic
│ ├── income.js \# Income logic
│ └── budget.js \# Budget logic
│
└── backend/
├── server.js \# Express app entry point
├── config/
│ └── db.js \# MySQL connection pool
├── middleware/
│ └── authMiddleware.js \# JWT verification
├── controllers/
│ ├── authController.js
│ ├── expenseController.js
│ ├── incomeController.js
│ └── budgetController.js
└── routes/
├── authRoutes.js
├── expenseRoutes.js
├── incomeRoutes.js
└── budgetRoutes.js
```

## ⚙️ Local Setup

### Prerequisites

- Node.js v18+
- MySQL (local or cloud)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/suvepatra004/Finance-Tracker.git
cd Finance-Tracker
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the `backend/` folder:

```env
MYSQLHOST=your_mysql_host
MYSQLUSER=your_mysql_user
MYSQLPASSWORD=your_mysql_password
MYSQLDATABASE=your_database_name
MYSQLPORT=3306
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

### 4. Set up the database

```bash
node setup.js
```

This will create all required tables automatically.

### 5. Start the backend server

```bash
npm run dev
```

Backend runs at: `http://localhost:5000`

### 6. Open `frontend`

Open `frontend/index.html` using **Live Server** (VS Code extension) or any static file server.

## 🔌 API Endpoints

### Auth

| Method | Endpoint             | Description           |
| :----- | :------------------- | :-------------------- |
| POST   | `/api/auth/register` | Register new user     |
| POST   | `/api/auth/login`    | Login and receive JWT |

### Expenses

| Method | Endpoint                | Description                          |
| :----- | :---------------------- | :----------------------------------- |
| GET    | `/api/expenses`         | Get expenses (paginated, filterable) |
| POST   | `/api/expenses`         | Add new expense                      |
| DELETE | `/api/expenses/:id`     | Delete expense                       |
| GET    | `/api/expenses/summary` | Monthly total + category breakdown   |

### Income

| Method | Endpoint              | Description                      |
| :----- | :-------------------- | :------------------------------- |
| GET    | `/api/income`         | Get income (paginated)           |
| POST   | `/api/income`         | Add new income                   |
| DELETE | `/api/income/:id`     | Delete income                    |
| GET    | `/api/income/summary` | Monthly total + source breakdown |

### Budgets

| Method | Endpoint           | Description             |
| :----- | :----------------- | :---------------------- |
| GET    | `/api/budgets`     | Get budgets for a month |
| POST   | `/api/budgets`     | Set or update a budget  |
| DELETE | `/api/budgets/:id` | Delete budget           |

> All endpoints except `/api/auth/*` require `Authorization: Bearer <token>` header.

## 🌐 Deployment

| Layer    | Platform | URL                                                  |
| :------- | :------- | :--------------------------------------------------- |
| Frontend | Vercel   | https://personal-finance-tracker-tau-silk.vercel.app |
| Backend  | Render   | https://finance-tracker-guaj.onrender.com            |
| Database | Railway  | MySQL Cloud                                          |

---

### ⚠️ Note on Render Free Tier

The backend is hosted on Render's free tier which spins down after 15 minutes of inactivity. The first request after an idle period may take 30–50 seconds to respond. This is expected behavior — subsequent requests are fast.

---

## 🔒 Security

- Passwords are hashed using **bcryptjs** before storing
- Authentication uses **JWT tokens** with expiry
- All API routes (except auth) are protected by middleware
- CORS is configured to allow only trusted origins

---

## ☠️ Developed By

<div align="center">
### Suvendu Kumar Patra

🎓 Passionate Full-Stack Developer | Building real-world projects one commit at a time

[![GitHub](https://img.shields.io/badge/GitHub-suvepatra004-181717?style=for-the-badge&logo=github)](https://github.com/suvepatra004)

_"Code is not just syntax — it's a solution to a real problem."_

</div>
<div align="center">

Made with ❤️ by **Suvendu Kumar Patra**

⭐ If you found this project helpful, consider giving it a star on GitHub!

</div>

## 📄 License

This project is built for educational and portfolio purposes. Feel free to fork and build upon it.
