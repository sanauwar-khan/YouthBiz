import { Router } from "express";
import {
  getAdminDashboard,
  getAdminPitch,
  getAdminProduct,
  getAdminProductMovements,
  getAdminStudent,
  listAdminInventory,
  listAdminPitches,
  listAdminProducts,
  listAdminStudents,
} from "../controllers/adminDataController.js";
import { createPrd, deletePrd, getPrd, listPrds, updatePrd } from "../controllers/adminPrdController.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";
import { requireCsrfToken } from "../middleware/csrfProtection.js";

const router = Router();

router.use(requireAdminAuth);
router.get("/dashboard", getAdminDashboard);
router.get("/students", listAdminStudents);
router.get("/students/:studentId", getAdminStudent);
router.get("/products", listAdminProducts);
router.get("/products/:productId", getAdminProduct);
router.get("/inventory", listAdminInventory);
router.get("/inventory/:productId/movements", getAdminProductMovements);
router.get("/business-pitches", listAdminPitches);
router.get("/business-pitches/:pitchId", getAdminPitch);
router.get("/prds", listPrds);
router.post("/prds", requireCsrfToken, createPrd);
router.get("/prds/:prdId", getPrd);
router.put("/prds/:prdId", requireCsrfToken, updatePrd);
router.delete("/prds/:prdId", requireCsrfToken, deletePrd);

export default router;
