import { Router } from "express";
import {
  createProgressStep,
  deleteProgressStep,
  listProgressSteps,
  updateProgressStep,
} from "../controllers/progressController.js";
import { requireStudentAuth } from "../middleware/requireStudentAuth.js";
import { requireCsrfToken } from "../middleware/csrfProtection.js";

const router = Router();

router.use(requireStudentAuth);
router.get("/", listProgressSteps);
router.post("/", requireCsrfToken, createProgressStep);
router.patch("/:stepId", requireCsrfToken, updateProgressStep);
router.delete("/:stepId", requireCsrfToken, deleteProgressStep);

export default router;