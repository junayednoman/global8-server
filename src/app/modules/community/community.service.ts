import { CommunityJoinRequestStatus, Prisma } from "@prisma/client";
import ApiError from "../../classes/ApiError";
import { TFile } from "../../interface/file.interface";
import { deleteFromS3, uploadToS3 } from "../../utils/awss3";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import prisma from "../../utils/prisma";
import {
  communitySelect,
  ensureCommunityAdmin,
  getCommunityMembershipMaps,
  mapCommunityCard,
} from "./community.utils";
import {
  TCreateCommunity,
  TReviewJoinRequest,
  TUpdateCommunity,
} from "./community.validation";

const create = async (
  authId: string,
  payload: TCreateCommunity,
  file?: TFile
) => {
  let imageUrl: string | undefined;
  if (file) {
    imageUrl = await uploadToS3(file);
  }

  try {
    const community = await prisma.$transaction(async tx => {
      const created = await tx.community.create({
        data: {
          creatorId: authId,
          title: payload.title,
          subTitle: payload.subTitle,
          image: imageUrl,
        },
        select: communitySelect,
      });

      await tx.communityMember.create({
        data: {
          communityId: created.id,
          memberAuthId: authId,
          role: "ADMIN",
        },
      });

      return created;
    });

    return mapCommunityCard(community, {
      communityId: community.id,
      role: "ADMIN",
    });
  } catch (error) {
    if (imageUrl) await deleteFromS3(imageUrl);
    throw error;
  }
};

const getAll = async (
  authId: string | undefined,
  options: TPaginationOptions,
  query: Record<string, unknown>
) => {
  const page = Number(options.page ?? 1);
  const limit = Number(options.limit ?? 10);
  if (!Number.isFinite(page) || page < 1)
    throw new ApiError(400, "Invalid page");
  if (!Number.isFinite(limit) || limit < 1 || limit > 100)
    throw new ApiError(400, "Invalid limit");

  const searchTerm =
    typeof query.searchTerm === "string" ? query.searchTerm.trim() : undefined;

  const whereConditions: Prisma.CommunityWhereInput = searchTerm
    ? {
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { subTitle: { contains: searchTerm, mode: "insensitive" } },
        ],
      }
    : {};

  const {
    page: currentPage,
    take,
    skip,
  } = calculatePagination({
    ...options,
    page,
    limit,
    sortBy: "createdAt",
    orderBy: "desc",
  });

  const communities = await prisma.community.findMany({
    where: whereConditions,
    skip,
    take,
    orderBy: { createdAt: "desc" },
    select: communitySelect,
  });

  const total = await prisma.community.count({ where: whereConditions });

  const communityIds = communities.map(community => community.id);
  const { roleByCommunityId, joinRequestByCommunityId } =
    await getCommunityMembershipMaps(authId, communityIds);

  return {
    meta: { page: currentPage, limit: take, total },
    communities: communities.map(community =>
      mapCommunityCard(
        community,
        roleByCommunityId.get(community.id),
        joinRequestByCommunityId.get(community.id)
      )
    ),
  };
};

const getMy = async (
  authId: string,
  options: TPaginationOptions,
  query: Record<string, unknown>
) => {
  const page = Number(options.page ?? 1);
  const limit = Number(options.limit ?? 10);
  if (!Number.isFinite(page) || page < 1)
    throw new ApiError(400, "Invalid page");
  if (!Number.isFinite(limit) || limit < 1 || limit > 100)
    throw new ApiError(400, "Invalid limit");

  const searchTerm =
    typeof query.searchTerm === "string" ? query.searchTerm.trim() : undefined;

  const andConditions: Prisma.CommunityWhereInput[] = [
    {
      communityMembers: {
        some: { memberAuthId: authId },
      },
    },
  ];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { subTitle: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }

  const whereConditions: Prisma.CommunityWhereInput = { AND: andConditions };

  const {
    page: currentPage,
    take,
    skip,
  } = calculatePagination({
    ...options,
    page,
    limit,
    sortBy: "createdAt",
    orderBy: "desc",
  });

  const communities = await prisma.community.findMany({
    where: whereConditions,
    skip,
    take,
    orderBy: { createdAt: "desc" },
    select: communitySelect,
  });

  const total = await prisma.community.count({ where: whereConditions });

  const communityIds = communities.map(community => community.id);
  const { roleByCommunityId, joinRequestByCommunityId } =
    await getCommunityMembershipMaps(authId, communityIds);

  return {
    meta: { page: currentPage, limit: take, total },
    communities: communities.map(community =>
      mapCommunityCard(
        community,
        roleByCommunityId.get(community.id),
        joinRequestByCommunityId.get(community.id)
      )
    ),
  };
};

const getSingle = async (id: string, authId: string | undefined) => {
  const community = await prisma.community.findUnique({
    where: { id },
    select: communitySelect,
  });
  if (!community) throw new ApiError(404, "Community not found");

  let myRole: "ADMIN" | "MEMBER" | null = null;
  let joinStatus: CommunityJoinRequestStatus | null = null;
  if (authId) {
    const [membership, request] = await Promise.all([
      prisma.communityMember.findUnique({
        where: {
          communityId_memberAuthId: {
            communityId: id,
            memberAuthId: authId,
          },
        },
        select: { role: true },
      }),
      prisma.communityJoinRequest.findUnique({
        where: {
          communityId_memberAuthId: {
            communityId: id,
            memberAuthId: authId,
          },
        },
        select: { status: true },
      }),
    ]);
    myRole = membership?.role ?? null;
    joinStatus = request?.status ?? null;
  }

  return {
    id: community.id,
    title: community.title,
    subTitle: community.subTitle,
    image: community.image,
    memberCount: community._count.communityMembers,
    myRole,
    joinStatus,
  };
};

const requestToJoin = async (communityId: string, authId: string) => {
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { id: true },
  });
  if (!community) throw new ApiError(404, "Community not found");

  const member = await prisma.communityMember.findUnique({
    where: {
      communityId_memberAuthId: {
        communityId,
        memberAuthId: authId,
      },
    },
    select: { id: true },
  });
  if (member) throw new ApiError(409, "You are already a community member");

  const existing = await prisma.communityJoinRequest.findUnique({
    where: {
      communityId_memberAuthId: {
        communityId,
        memberAuthId: authId,
      },
    },
    select: { id: true, status: true },
  });

  if (!existing) {
    return prisma.communityJoinRequest.create({
      data: {
        communityId,
        memberAuthId: authId,
      },
      select: {
        id: true,
        communityId: true,
        memberAuthId: true,
        status: true,
        date: true,
      },
    });
  }

  if (existing.status === CommunityJoinRequestStatus.PENDING) {
    throw new ApiError(409, "Join request already pending");
  }

  return prisma.communityJoinRequest.update({
    where: { id: existing.id },
    data: { status: CommunityJoinRequestStatus.PENDING },
    select: {
      id: true,
      communityId: true,
      memberAuthId: true,
      status: true,
      date: true,
    },
  });
};

const reviewJoinRequest = async (
  communityId: string,
  requestId: string,
  adminAuthId: string,
  payload: TReviewJoinRequest
) => {
  await ensureCommunityAdmin(communityId, adminAuthId);

  const request = await prisma.communityJoinRequest.findUnique({
    where: { id: requestId },
    select: { id: true, communityId: true, memberAuthId: true, status: true },
  });
  if (!request || request.communityId !== communityId) {
    throw new ApiError(404, "Join request not found");
  }

  return prisma.$transaction(async tx => {
    const updated = await tx.communityJoinRequest.update({
      where: { id: requestId },
      data: { status: payload.status },
      select: {
        id: true,
        communityId: true,
        memberAuthId: true,
        status: true,
        date: true,
      },
    });

    if (payload.status === CommunityJoinRequestStatus.APPROVED) {
      await tx.communityMember.upsert({
        where: {
          communityId_memberAuthId: {
            communityId,
            memberAuthId: request.memberAuthId,
          },
        },
        update: {},
        create: {
          communityId,
          memberAuthId: request.memberAuthId,
          role: "MEMBER",
        },
      });
    }

    return updated;
  });
};

const getJoinRequests = async (
  communityId: string,
  authId: string,
  options: TPaginationOptions,
  query: Record<string, unknown>
) => {
  await ensureCommunityAdmin(communityId, authId);

  const page = Number(options.page ?? 1);
  const limit = Number(options.limit ?? 10);
  if (!Number.isFinite(page) || page < 1)
    throw new ApiError(400, "Invalid page");
  if (!Number.isFinite(limit) || limit < 1 || limit > 100)
    throw new ApiError(400, "Invalid limit");

  const status =
    typeof query.status === "string"
      ? query.status.trim().toUpperCase()
      : undefined;
  const allowed = new Set(["PENDING", "APPROVED", "REJECTED"]);
  if (status && !allowed.has(status)) throw new ApiError(400, "Invalid status");

  const whereConditions: Prisma.CommunityJoinRequestWhereInput = {
    communityId,
    ...(status ? { status: status as CommunityJoinRequestStatus } : {}),
  };

  const {
    page: currentPage,
    take,
    skip,
  } = calculatePagination({
    ...options,
    page,
    limit,
    sortBy: "date",
    orderBy: "desc",
  });

  const requests = await prisma.communityJoinRequest.findMany({
    where: whereConditions,
    skip,
    take,
    orderBy: { date: "desc" },
    select: {
      id: true,
      memberAuthId: true,
      status: true,
      date: true,
      member: {
        select: {
          id: true,
          profile: { select: { name: true, image: true } },
        },
      },
    },
  });

  const total = await prisma.communityJoinRequest.count({
    where: whereConditions,
  });

  return {
    meta: { page: currentPage, limit: take, total },
    requests,
  };
};

const removeMember = async (
  communityId: string,
  memberAuthId: string,
  adminAuthId: string
) => {
  const community = await ensureCommunityAdmin(communityId, adminAuthId);

  if (community.creatorId === memberAuthId) {
    throw new ApiError(400, "Creator cannot be removed from community");
  }

  const target = await prisma.communityMember.findUnique({
    where: {
      communityId_memberAuthId: {
        communityId,
        memberAuthId,
      },
    },
    select: { role: true },
  });
  if (!target) throw new ApiError(404, "Member not found");
  if (target.role === "ADMIN") {
    throw new ApiError(400, "Admin member cannot be removed");
  }

  await prisma.communityMember.delete({
    where: {
      communityId_memberAuthId: {
        communityId,
        memberAuthId,
      },
    },
  });
};

const update = async (
  id: string,
  authId: string,
  payload: TUpdateCommunity,
  file?: TFile
) => {
  await ensureCommunityAdmin(id, authId);

  let imageUrl: string | undefined;
  if (file) {
    imageUrl = await uploadToS3(file);
  }

  const existing = await prisma.community.findUnique({
    where: { id },
    select: { image: true },
  });
  if (!existing) {
    if (imageUrl) await deleteFromS3(imageUrl);
    throw new ApiError(404, "Community not found");
  }

  try {
    const updated = await prisma.community.update({
      where: { id },
      data: {
        ...payload,
        ...(imageUrl ? { image: imageUrl } : {}),
      },
      select: communitySelect,
    });

    if (imageUrl && existing.image) {
      await deleteFromS3(existing.image);
    }

    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_memberAuthId: {
          communityId: id,
          memberAuthId: authId,
        },
      },
      select: { role: true },
    });
    const joinRequest = await prisma.communityJoinRequest.findUnique({
      where: {
        communityId_memberAuthId: {
          communityId: id,
          memberAuthId: authId,
        },
      },
      select: { status: true },
    });

    return mapCommunityCard(
      updated,
      membership ? { communityId: id, role: membership.role } : undefined,
      joinRequest ? { communityId: id, status: joinRequest.status } : undefined
    );
  } catch (error) {
    if (imageUrl) await deleteFromS3(imageUrl);
    throw error;
  }
};

const remove = async (id: string, authId: string) => {
  const community = await ensureCommunityAdmin(id, authId);

  const result = await prisma.$transaction(async tx => {
    const chats = await tx.chat.findMany({
      where: { communityId: id },
      select: { id: true },
    });
    const chatIds = chats.map(chat => chat.id);

    if (chatIds.length) {
      await tx.message.deleteMany({ where: { chatId: { in: chatIds } } });
      await tx.chat.deleteMany({ where: { id: { in: chatIds } } });
    }

    await tx.communityJoinRequest.deleteMany({ where: { communityId: id } });
    await tx.communityMember.deleteMany({ where: { communityId: id } });
    return tx.community.delete({ where: { id } });
  });

  if (community.image) await deleteFromS3(community.image);

  return result;
};

const getMembers = async (
  communityId: string,
  authId: string,
  options: TPaginationOptions
) => {
  await ensureCommunityAdmin(communityId, authId);

  const page = Number(options.page ?? 1);
  const limit = Number(options.limit ?? 10);
  if (!Number.isFinite(page) || page < 1)
    throw new ApiError(400, "Invalid page");
  if (!Number.isFinite(limit) || limit < 1 || limit > 100)
    throw new ApiError(400, "Invalid limit");

  const {
    page: currentPage,
    take,
    skip,
  } = calculatePagination({
    ...options,
    page,
    limit,
    sortBy: "joinedAt",
    orderBy: "desc",
  });

  const members = await prisma.communityMember.findMany({
    where: { communityId },
    skip,
    take,
    orderBy: { joinedAt: "desc" },
    select: {
      memberAuthId: true,
      role: true,
      joinedAt: true,
      member: {
        select: {
          id: true,
          profile: { select: { name: true, image: true } },
        },
      },
    },
  });

  const total = await prisma.communityMember.count({ where: { communityId } });

  return {
    meta: { page: currentPage, limit: take, total },
    members,
  };
};

export const CommunityService = {
  create,
  getAll,
  getMy,
  getSingle,
  requestToJoin,
  reviewJoinRequest,
  getJoinRequests,
  removeMember,
  update,
  remove,
  getMembers,
};
