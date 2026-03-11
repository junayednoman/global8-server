import ApiError from "../../classes/ApiError";
import prisma from "../../utils/prisma";
import { TCreateStaff, TUpdateStaff } from "./staff.validation";

const getAll = async (authId: string) => {
  const staffs = await prisma.staff.findMany({
    where: { authId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      authId: true,
      name: true,
      role: true,
    },
  });

  return staffs;
};

const create = async (authId: string, payload: TCreateStaff) => {
  return prisma.staff.create({
    data: {
      authId,
      name: payload.name,
      role: payload.role,
    },
    select: {
      id: true,
      authId: true,
      name: true,
      role: true,
    },
  });
};

const update = async (id: string, authId: string, payload: TUpdateStaff) => {
  const staff = await prisma.staff.findUnique({
    where: { id },
    select: { id: true, authId: true },
  });
  if (!staff) throw new ApiError(404, "Staff not found");
  if (staff.authId !== authId) throw new ApiError(403, "Not authorized");

  return prisma.staff.update({
    where: { id },
    data: {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.role !== undefined ? { role: payload.role } : {}),
    },
    select: {
      id: true,
      authId: true,
      name: true,
      role: true,
    },
  });
};

const remove = async (id: string, authId: string) => {
  const staff = await prisma.staff.findUnique({
    where: { id },
    select: { id: true, authId: true },
  });
  if (!staff) throw new ApiError(404, "Staff not found");
  if (staff.authId !== authId) throw new ApiError(403, "Not authorized");

  await prisma.staff.delete({ where: { id } });
};

export const StaffService = {
  getAll,
  create,
  update,
  remove,
};
