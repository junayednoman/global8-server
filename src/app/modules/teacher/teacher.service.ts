import { Prisma, UserRole, UserStatus } from "@prisma/client";
import ApiError from "../../classes/ApiError";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import prisma from "../../utils/prisma";
import {
  TEACHER_ALLOWED_SORT_FIELDS,
  TEACHER_ORDER_BY_VALUES,
} from "./teacher.constants";

const getAll = async (
  options: TPaginationOptions,
  query: Record<string, any>
) => {
  const page = Number(options.page ?? 1);
  const limit = Number(options.limit ?? 10);
  if (!Number.isFinite(page) || page < 1) {
    throw new ApiError(400, "Invalid page");
  }
  if (!Number.isFinite(limit) || limit < 1 || limit > 100) {
    throw new ApiError(400, "Invalid limit");
  }

  let sortBy = typeof options.sortBy === "string" ? options.sortBy : undefined;
  const orderByValue =
    typeof options.orderBy === "string"
      ? options.orderBy.toLowerCase()
      : undefined;

  if (sortBy && !TEACHER_ALLOWED_SORT_FIELDS.has(sortBy)) {
    throw new ApiError(400, "Invalid sortBy field");
  }
  if (orderByValue && !TEACHER_ORDER_BY_VALUES.has(orderByValue)) {
    throw new ApiError(400, "Invalid orderBy value");
  }
  if (!sortBy) {
    sortBy = "createdAt";
  }

  const andConditions: Prisma.AuthWhereInput[] = [];

  andConditions.push({
    role: UserRole.TEACHER,
    status: UserStatus.ACTIVE,
    profile: { is: { isVisible: true } },
  });

  const searchTerm =
    typeof query.searchTerm === "string" ? query.searchTerm.trim() : undefined;
  if (searchTerm) {
    andConditions.push({
      profile: {
        is: {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { bio: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
      },
    });
  }

  const interest =
    typeof query.interest === "string" ? query.interest.trim() : undefined;
  if (interest) {
    andConditions.push({
      profile: { is: { interests: { has: interest } } },
    });
  }

  const whereConditions: Prisma.AuthWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const {
    page: currentPage,
    take,
    skip,
  } = calculatePagination({
    ...options,
    page,
    limit,
    sortBy,
    orderBy: orderByValue as "asc" | "desc" | undefined,
  });

  const resolvedOrderBy: Prisma.SortOrder = (orderByValue ?? "desc") as
    | "asc"
    | "desc";
  let orderByClause: Prisma.AuthOrderByWithRelationInput;
  if (sortBy === "name") {
    orderByClause = { profile: { name: resolvedOrderBy } };
  } else if (sortBy === "classCount") {
    orderByClause = { class: { _count: resolvedOrderBy } };
  } else {
    orderByClause = { createdAt: resolvedOrderBy };
  }

  const teachers = await prisma.auth.findMany({
    where: whereConditions,
    skip,
    take,
    orderBy: orderByClause,
    select: {
      id: true,
      profile: {
        select: {
          name: true,
          image: true,
          interests: true,
        },
      },
      _count: {
        select: {
          class: true,
        },
      },
    },
  });

  const total = await prisma.auth.count({
    where: whereConditions,
  });

  const formattedTeachers = teachers.map(teacher => ({
    id: teacher.id,
    name: teacher.profile?.name ?? null,
    image: teacher.profile?.image ?? null,
    interests: teacher.profile?.interests ?? [],
    classCount: teacher._count.class,
  }));

  const meta = {
    page: currentPage,
    limit: take,
    total,
  };

  return { meta, teachers: formattedTeachers };
};

export const TeacherService = {
  getAll,
};
