import { z } from "zod";
import ApiError from "../classes/ApiError";

export const dateStringSchema = z
  .string()
  .trim()
  .refine(value => !Number.isNaN(Date.parse(value)), "Invalid date format");

export const parseDateOrThrow = (value: string, message = "Invalid date") => {
  const parsed = dateStringSchema.safeParse(value);
  if (!parsed.success) {
    throw new ApiError(400, message);
  }

  return new Date(parsed.data);
};

export const assertFutureDate = (
  date: Date,
  message = "Date must be in the future"
) => {
  if (date.getTime() <= Date.now()) {
    throw new ApiError(400, message);
  }
};

