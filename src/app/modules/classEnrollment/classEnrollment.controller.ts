import { Response } from "express";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { TAuthUser, TRequest } from "../../interface/global.interface";
import { ClassEnrollmentService } from "./classEnrollment.service";
import pick from "../../utils/pick";
import ApiError from "../../classes/ApiError";

const create = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const studentId = (req.user as TAuthUser).id;
  const result = await ClassEnrollmentService.create(req.body, studentId);

  sendResponse(res, {
    status: result.type === "payment" ? 200 : 201,
    message:
      result.type === "payment"
        ? "Payment session created successfully!"
        : "Class enrollment request submitted successfully!",
    data: result.type === "payment" ? { url: result.url } : result.result,
  });
});

const paymentCallback = handleAsyncRequest(async (req: TRequest, res) => {
  await ClassEnrollmentService.paymentCallback(req.query);
  sendResponse(res, {
    message: "Class enrollment payment processed successfully!",
    data: null,
  });
});

const getAll = handleAsyncRequest(async (req: TRequest, res) => {
  const teacherId = (req.user as TAuthUser).id;
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const filters = pick(req.query, ["status", "classId"]);

  const result = await ClassEnrollmentService.getAll(
    teacherId,
    options,
    filters
  );

  sendResponse(res, {
    message: "Class enrollments retrieved successfully!",
    data: result,
  });
});

const updateStatus = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.id)
    throw new ApiError(400, "Class enrollment id is required");
  const teacherId = (req.user as TAuthUser).id;

  const result = await ClassEnrollmentService.updateStatus(
    req.params.id,
    teacherId,
    req.body
  );

  sendResponse(res, {
    message: "Class enrollment status updated successfully!",
    data: result,
  });
});

export const ClassEnrollmentController = {
  create,
  paymentCallback,
  getAll,
  updateStatus,
};
