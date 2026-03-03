import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  setBudget,
  getBudgets,
  deleteBudget,
} from "../controllers/budgetController.js";

const router = express.Router();

router.use(protect); // All routes below are JWT protected

router.post("/", setBudget);
router.get("/", getBudgets);
router.delete("/:id", deleteBudget);

export default router;
