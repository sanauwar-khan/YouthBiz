import { Router } from "express";
import {
  listInventory,
  listInventoryMovements,
  recordProduction,
  recordSale,
} from "../controllers/productController.js";
import { requireStudentAuth } from "../middleware/requireStudentAuth.js";
import { requireCsrfToken } from "../middleware/csrfProtection.js";

const router = Router();

router.use(requireStudentAuth);
router.get("/", listInventory);
router.get("/:productId/movements", listInventoryMovements);
router.post("/:productId/production", requireCsrfToken, recordProduction);
router.post("/:productId/sales", requireCsrfToken, recordSale);

export default router;