import { Router } from "express";
import { getCurrentStudent, issueCsrfToken, loginStudent, logoutStudent, registerStudent } from "../controllers/authController.js";
import { requireCsrfToken } from "../middleware/csrfProtection.js";
import { requireStudentAuth } from "../middleware/requireStudentAuth.js";

const router = Router();

router.get("/csrf", issueCsrfToken);
router.get("/me", requireStudentAuth, getCurrentStudent);
router.post("/register", requireCsrfToken, registerStudent);
router.post("/login", requireCsrfToken, loginStudent);
router.post("/logout", requireCsrfToken, logoutStudent);

export default router;