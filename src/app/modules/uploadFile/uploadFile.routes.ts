import { Router } from "express";
import { upload } from "../../utils/awss3";
import { fileController } from "./uploadFile.controller";

const router = Router();

router.post("/", upload.single("file"), fileController.uploadSingle);

router.post(
  "/multiple",

  upload.array("files"),
  fileController.uploadMultiple
);

router.delete("/", fileController.deleteSingle);

router.delete("/multiple", fileController.deleteMultiple);

export const fileRoutes = router;
