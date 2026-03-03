import pool from "../config/db.js";

// Add expense
export const addExpense = async (req, res) => {
  const { amount, category, description, date } = req.body;

  if (!amount || !category || !date) {
    return res
      .status(400)
      .json({ message: "Amount, category and date are required" });
  }

  try {
    await pool.query(
      "INSERT INTO expenses (user_id, amount, category, description, date) VALUES (?, ?, ?, ?, ?)",
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
    const [result] = await pool.query(
      "DELETE FROM expenses WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Expense not found" });
    }
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

  let query = "SELECT * FROM expenses WHERE user_id = ?";
  let countQuery = "SELECT COUNT(*) as total FROM expenses WHERE user_id = ?";
  let params = [req.user.id];
  let countParams = [req.user.id];

  if (category) {
    query += " AND category = ?";
    countQuery += " AND category = ?";
    params.push(category);
    countParams.push(category);
  }
  if (search) {
    query += " AND description LIKE ?";
    countQuery += " AND description LIKE ?";
    params.push(`%${search}%`);
    countParams.push(`%${search}%`);
  }
  if (month) {
    query += " AND DATE_FORMAT(date, '%Y-%m') = ?";
    countQuery += " AND DATE_FORMAT(date, '%Y-%m') = ?";
    params.push(month);
    countParams.push(month);
  }

  query += " ORDER BY date DESC LIMIT ? OFFSET ?";
  params.push(Number(limit), Number(offset));

  try {
    const [rows] = await pool.query(query, params);
    const [[{ total }]] = await pool.query(countQuery, countParams);

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

  if (!month) {
    return res.status(400).json({ message: "Month is required (YYYY-MM)" });
  }

  try {
    const [breakdown] = await pool.query(
      `SELECT category, SUM(amount) as total
       FROM expenses
       WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?
       GROUP BY category
       ORDER BY total DESC`,
      [req.user.id, month],
    );

    const [[{ monthlyTotal }]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as monthlyTotal
       FROM expenses
       WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?`,
      [req.user.id, month],
    );

    res.json({ month, monthlyTotal, breakdown });
  } catch (err) {
    console.error("Monthly summary error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
