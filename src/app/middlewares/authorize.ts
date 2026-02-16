import { NextFunction, Response } from "express";
import jwt, { Secret } from "jsonwebtoken";
import { TAuthUser, TRequest } from "../interface/global.interface";
import ApiError from "../classes/ApiError";
import config from "../config";

const authorize = (...roles: string[]) => {
  return async (req: TRequest, _res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new ApiError(401, "Unauthorized");
      }
      const token = authHeader.split("Bearer ")[1];

      if (!token) throw new ApiError(401, "Unauthorized");

      const decodedUser = jwt.verify(
        token,
        config.jwt.accessSecret as Secret
      ) as TAuthUser;
      req.user = decodedUser;

      if (roles.length && !roles.includes(decodedUser.role)) {
        throw new ApiError(403, "Forbidden!");
      }

      next();
    } catch (error: any) {
      next(error);
    }
  };
};

export default authorize;
