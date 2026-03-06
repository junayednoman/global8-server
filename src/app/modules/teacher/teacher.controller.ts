import { Response } from "express";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { TRequest } from "../../interface/global.interface";
import pick from "../../utils/pick";
import { TeacherService } from "./teacher.service";

const getAll = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const filters = pick(req.query, ["searchTerm", "interest"]);

  const result = await TeacherService.getAll(options, filters);

  sendResponse(res, {
    message: "Teachers retrieved successfully!",
    data: result,
  });
});

export const TeacherController = {
  getAll,
};
