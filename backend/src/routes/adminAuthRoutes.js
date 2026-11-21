import { Router } from "express";
import { getCurrentAdmin, loginAdmin, logoutAdmin } from "../controllers/adminAuthController.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";
import { requireCsrfToken } from "../middleware/csrfProtection.js";

const router = Router();

router.post("/login", requireCsrfToken, loginAdmin);
router.get("/me", requireAdminAuth, getCurrentAdmin);
router.post("/logout", requireCsrfToken, logoutAdmin);

export default router;
