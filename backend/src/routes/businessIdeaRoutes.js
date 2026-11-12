import { Router } from "express";
import {
  createBusinessIdea,
  deleteBusinessIdea,
  getBusinessIdea,
  listBusinessIdeas,
  updateBusinessIdea,
} from "../controllers/businessIdeaController.js";
import { requireStudentAuth } from "../middleware/requireStudentAuth.js";
import { requireCsrfToken } from "../middleware/csrfProtection.js";

const router = Router();

router.use(requireStudentAuth);
router.get("/", listBusinessIdeas);
router.post("/", requireCsrfToken, createBusinessIdea);
router.get("/:ideaId", getBusinessIdea);
router.patch("/:ideaId", requireCsrfToken, updateBusinessIdea);
router.delete("/:ideaId", requireCsrfToken, deleteBusinessIdea);

export default router;