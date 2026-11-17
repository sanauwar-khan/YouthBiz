import { Router } from "express";
import {
  archiveBusinessPitch,
  createBusinessPitch,
  getBusinessPitch,
  listBusinessPitches,
  updateBusinessPitch,
} from "../controllers/businessPitchController.js";
import { requireStudentAuth } from "../middleware/requireStudentAuth.js";
import { requireCsrfToken } from "../middleware/csrfProtection.js";

const router = Router();

router.use(requireStudentAuth);
router.get("/", listBusinessPitches);
router.post("/", requireCsrfToken, createBusinessPitch);
router.get("/:pitchId", getBusinessPitch);
router.patch("/:pitchId", requireCsrfToken, updateBusinessPitch);
router.patch("/:pitchId/archive", requireCsrfToken, archiveBusinessPitch);

export default router;