import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { TAuthUser, TRequest } from "../../interface/global.interface";
import { ProductService } from "./product.service";
import { TFile } from "../../interface/file.interface";
import pick from "../../utils/pick";
import ApiError from "../../classes/ApiError";

const create = handleAsyncRequest(async (req: TRequest, res) => {
  const vendorId = (req.user as TAuthUser).id;

  const result = await ProductService.create(
    vendorId,
    req.body,
    req.file as TFile
  );

  sendResponse(res, {
    status: 201,
    message: "Product created successfully!",
    data: result,
  });
});

const getAll = handleAsyncRequest(async (req, res) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const result = await ProductService.getAll(options, req.query);

  sendResponse(res, {
    message: "Products retrieved successfully!",
    data: result,
  });
});

const getSingle = handleAsyncRequest(async (req: TRequest, res) => {
  const result = await ProductService.getSingle(
    req.params.id as string,
    req.user?.id as string
  );

  sendResponse(res, {
    message: "Product retrieved successfully!",
    data: result,
  });
});

const addProductColor = handleAsyncRequest(async (req: TRequest, res) => {
  const result = await ProductService.addProductColor(
    req.params.id as string,
    req.body.color,
    req.file as TFile
  );

  sendResponse(res, {
    message: "Product color added successfully!",
    data: result,
  });
});

const removeProductColor = handleAsyncRequest(async (req: TRequest, res) => {
  const result = await ProductService.removeProductColor(
    req.params.id as string,
    req.params.color as string
  );

  sendResponse(res, {
    message: "Product color removed successfully!",
    data: result,
  });
});

const update = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.id) throw new ApiError(400, "Product id is required");
  const vendorId = (req.user as TAuthUser).id;

  const result = await ProductService.update(req.params.id, vendorId, req.body);

  sendResponse(res, {
    message: "Product updated successfully!",
    data: result,
  });
});

const remove = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.id) throw new ApiError(400, "Product id is required");
  const vendorId = (req.user as TAuthUser).id;

  await ProductService.remove(req.params.id, vendorId);

  sendResponse(res, {
    message: "Product deleted successfully!",
    data: null,
  });
});

export const ProductController = {
  create,
  getAll,
  getSingle,
  addProductColor,
  removeProductColor,
  update,
  remove,
};
