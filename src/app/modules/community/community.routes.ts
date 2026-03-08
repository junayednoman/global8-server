import { Router } from "express";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { uploadImage } from "../../utils/awss3";
import { CommunityController } from "./community.controller";
import {
  createCommunitySchema,
  reviewJoinRequestSchema,
  updateCommunitySchema,
} from "./community.validation";

const router = Router();

router.post(
  "/",
  authorize(),
  uploadImage.single("image"),
  validate(createCommunitySchema, { formData: true }),
  CommunityController.create
);

router.get("/", authorize({ optional: true }), CommunityController.getAll);
router.get("/my", authorize(), CommunityController.getMy);
router.get(
  "/:id",
  authorize({ optional: true }),
  CommunityController.getSingle
);

router.post(
  "/:id/join-requests",
  authorize(),
  CommunityController.requestToJoin
);
router.patch(
  "/:id/join-requests/:requestId",
  authorize(),
  validate(reviewJoinRequestSchema),
  CommunityController.reviewJoinRequest
);
router.get(
  "/:id/join-requests",
  authorize(),
  CommunityController.getJoinRequests
);
router.get("/:id/members", authorize(), CommunityController.getMembers);
router.delete(
  "/:id/members/:memberAuthId",
  authorize(),
  CommunityController.removeMember
);

router.patch(
  "/:id",
  authorize(),
  uploadImage.single("image"),
  validate(updateCommunitySchema, { formData: true }),
  CommunityController.update
);
router.delete("/:id", authorize(), CommunityController.remove);

export const communityRoutes = router;
