import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

import authRoutes from "./routes/authRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import incomeRoutes from "./routes/incomeRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";

const app = express();

app.use(
  cors({
    origin: [
      "https://personal-finance-tracker-tau-silk.vercel.app/",
      "http://localhost:3000", // ✅ add this
      "http://127.0.0.1:3000", // ✅ add this
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "http://localhost:5501",
      "http://127.0.0.1:5501",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json());

app.get("/", (req, res) =>
  res.json({ message: "Finance Tracker API is running..." }),
);

app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/budgets", budgetRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🤓 Server running on port ${PORT}`));
