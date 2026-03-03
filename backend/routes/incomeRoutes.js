import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  addIncome,
  deleteIncome,
  getIncome,
  getIncomeSummary,
} from "../controllers/incomeController.js";

const router = express.Router();

router.use(protect); // All routes below are JWT protected

router.post("/", addIncome);
router.delete("/:id", deleteIncome);
router.get("/summary", getIncomeSummary);
router.get("/", getIncome);

export default router;
