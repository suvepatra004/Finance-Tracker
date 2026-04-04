import pool from "../config/db.js";

// Add expense
export const addExpense = async (req, res) => {
  const { amount, category, description, date } = req.body;

  if (!amount || !category || !date)
    return res
      .status(400)
      .json({ message: "Amount, category and date are required" });

  try {
    await pool.query(
      "INSERT INTO expenses (user_id, amount, category, description, date) VALUES ($1, $2, $3, $4, $5)",
      [req.user.id, amount, category, description || null, date],
    );
    res.status(201).json({ message: "Expense added" });
  } catch (err) {
    console.error("Add expense error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete expense
export const deleteExpense = async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM expenses WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id],
    );
    if (result.rowCount === 0)
      return res.status(404).json({ message: "Expense not found" });

    res.json({ message: "Expense deleted" });
  } catch (err) {
    console.error("Delete expense error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get expenses with pagination, search, filter
export const getExpenses = async (req, res) => {
  const { page = 1, limit = 10, category, search, month } = req.query;
  const offset = (page - 1) * limit;

  let conditions = ["user_id = $1"];
  let params = [req.user.id];
  let idx = 2;

  if (category) {
    conditions.push(`category = $${idx++}`);
    params.push(category);
  }
  if (search) {
    conditions.push(`description ILIKE $${idx++}`);
    params.push(`%${search}%`);
  }
  if (month) {
    conditions.push(`TO_CHAR(date, 'YYYY-MM') = $${idx++}`);
    params.push(month);
  }

  const where = conditions.join(" AND ");

  try {
    const { rows } = await pool.query(
      `SELECT * FROM expenses WHERE ${where} ORDER BY date DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, Number(limit), Number(offset)],
    );
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) as total FROM expenses WHERE ${where}`,
      params,
    );
    const total = parseInt(countRows[0].total);

    res.json({
      data: rows,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get expenses error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Monthly total + category summary
export const getMonthlySummary = async (req, res) => {
  const { month } = req.query;

  if (!month)
    return res.status(400).json({ message: "Month is required (YYYY-MM)" });

  try {
    const { rows: breakdown } = await pool.query(
      `SELECT category, SUM(amount) as total
       FROM expenses
       WHERE user_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2
       GROUP BY category ORDER BY total DESC`,
      [req.user.id, month],
    );

    const { rows: totalRows } = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as monthlytotal
       FROM expenses
       WHERE user_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2`,
      [req.user.id, month],
    );

    res.json({ month, monthlyTotal: totalRows[0].monthlytotal, breakdown });
  } catch (err) {
    console.error("Monthly summary error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
