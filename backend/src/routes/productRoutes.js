import { Router } from "express";
import {
  archiveProduct,
  createProduct,
  getProduct,
  listProducts,
  updateProduct,
} from "../controllers/productController.js";
import { requireStudentAuth } from "../middleware/requireStudentAuth.js";
import { requireCsrfToken } from "../middleware/csrfProtection.js";

const router = Router();

router.use(requireStudentAuth);
router.get("/", listProducts);
router.post("/", requireCsrfToken, createProduct);
router.get("/:productId", getProduct);
router.patch("/:productId", requireCsrfToken, updateProduct);
router.patch("/:productId/archive", requireCsrfToken, archiveProduct);

export default router;