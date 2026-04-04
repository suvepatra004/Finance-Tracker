import pool from "../config/db.js";

// Set or update budget
export const setBudget = async (req, res) => {
  const { category, monthly_limit, month } = req.body;

  if (!category || !monthly_limit || !month)
    return res
      .status(400)
      .json({ message: "Category, limit and month are required" });

  try {
    await pool.query(
      `INSERT INTO budgets (user_id, category, monthly_limit, month)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, category, month)
       DO UPDATE SET monthly_limit = EXCLUDED.monthly_limit`,
      [req.user.id, category, monthly_limit, month],
    );
    res.status(201).json({ message: "Budget saved" });
  } catch (err) {
    console.error("Set budget error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all budgets for a month
export const getBudgets = async (req, res) => {
  const { month } = req.query;

  if (!month)
    return res.status(400).json({ message: "Month is required (YYYY-MM)" });

  try {
    const { rows } = await pool.query(
      "SELECT * FROM budgets WHERE user_id = $1 AND month = $2",
      [req.user.id, month],
    );
    res.json(rows);
  } catch (err) {
    console.error("Get budgets error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete budget
export const deleteBudget = async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM budgets WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id],
    );
    if (result.rowCount === 0)
      return res.status(404).json({ message: "Budget not found" });

    res.json({ message: "Budget deleted" });
  } catch (err) {
    console.error("Delete budget error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
