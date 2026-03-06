import { Router } from "express";
import { TeacherController } from "./teacher.controller";

const router = Router();

router.get("/", TeacherController.getAll);

export const teacherRoutes = router;
