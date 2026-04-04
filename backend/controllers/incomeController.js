import pool from "../config/db.js";

// Add income
export const addIncome = async (req, res) => {
  const { amount, source, frequency, date } = req.body;

  if (!amount || !source || !date)
    return res
      .status(400)
      .json({ message: "Amount, source and date are required" });

  try {
    await pool.query(
      "INSERT INTO income (user_id, amount, source, frequency, date) VALUES ($1, $2, $3, $4, $5)",
      [req.user.id, amount, source, frequency || "monthly", date],
    );
    res.status(201).json({ message: "Income added" });
  } catch (err) {
    console.error("Add income error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete income
export const deleteIncome = async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM income WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id],
    );
    if (result.rowCount === 0)
      return res.status(404).json({ message: "Income not found" });

    res.json({ message: "Income deleted" });
  } catch (err) {
    console.error("Delete income error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all income with pagination
export const getIncome = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const { rows } = await pool.query(
      "SELECT * FROM income WHERE user_id = $1 ORDER BY date DESC LIMIT $2 OFFSET $3",
      [req.user.id, Number(limit), Number(offset)],
    );
    const { rows: countRows } = await pool.query(
      "SELECT COUNT(*) as total FROM income WHERE user_id = $1",
      [req.user.id],
    );
    const total = parseInt(countRows[0].total);

    res.json({
      data: rows,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get income error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Monthly income summary
export const getIncomeSummary = async (req, res) => {
  const { month } = req.query;

  if (!month)
    return res.status(400).json({ message: "Month is required (YYYY-MM)" });

  try {
    const { rows: totalRows } = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as monthlytotal
       FROM income
       WHERE user_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2`,
      [req.user.id, month],
    );

    const { rows: breakdown } = await pool.query(
      `SELECT source, SUM(amount) as total
       FROM income
       WHERE user_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2
       GROUP BY source ORDER BY total DESC`,
      [req.user.id, month],
    );

    res.json({ month, monthlyTotal: totalRows[0].monthlytotal, breakdown });
  } catch (err) {
    console.error("Income summary error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
