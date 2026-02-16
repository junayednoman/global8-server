import { Router } from "express";
import authorize from "../../middlewares/authorize";
import { UserRole } from "@prisma/client";
import { ProductController } from "./product.controller";
import { upload } from "../../utils/awss3";
import validate from "../../middlewares/validate";
import {
  addProductColorSchema,
  createProductSchema,
  updateProductSchema,
} from "./product.validation";

const router = Router();

router.post(
  "/",
  authorize(UserRole.VENDOR),
  upload.single("image"),
  validate(createProductSchema, { formData: true }),
  ProductController.create
);

router.get("/", ProductController.getAll);
router.get("/:id", ProductController.getSingle);

router.post(
  "/:id/colors",
  authorize(UserRole.VENDOR),
  upload.single("image"),
  validate(addProductColorSchema, { formData: true }),
  ProductController.addProductColor
);

router.delete(
  "/:id/colors/:color",
  authorize(UserRole.VENDOR),
  ProductController.removeProductColor
);

router.patch(
  "/:id",
  authorize(UserRole.VENDOR),
  validate(updateProductSchema),
  ProductController.update
);

router.delete("/:id", authorize(UserRole.VENDOR), ProductController.remove);

export const productRoutes = router;
