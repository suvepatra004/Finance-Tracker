import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  addExpense,
  deleteExpense,
  getExpenses,
  getMonthlySummary,
} from "../controllers/expenseController.js";

const router = express.Router();

router.use(protect); // All routes below are JWT protected

router.post("/", addExpense);
router.delete("/:id", deleteExpense);
router.get("/summary", getMonthlySummary);
router.get("/", getExpenses);

export default router;
