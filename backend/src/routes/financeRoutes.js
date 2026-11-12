import { Router } from "express";
import {
  createTransaction,
  deleteTransaction,
  getFinance,
  updateTransaction,
} from "../controllers/financeController.js";
import { requireStudentAuth } from "../middleware/requireStudentAuth.js";
import { requireCsrfToken } from "../middleware/csrfProtection.js";

const router = Router();

router.use(requireStudentAuth);
router.get("/", getFinance);
router.post("/transactions", requireCsrfToken, createTransaction);
router.patch("/transactions/:transactionId", requireCsrfToken, updateTransaction);
router.delete("/transactions/:transactionId", requireCsrfToken, deleteTransaction);

export default router;