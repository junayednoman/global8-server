import {
  CommunityJoinRequestStatus,
  CommunityMemberRole,
  Prisma,
} from "@prisma/client";
import ApiError from "../../classes/ApiError";
import prisma from "../../utils/prisma";

export const communitySelect = {
  id: true,
  creatorId: true,
  image: true,
  title: true,
  subTitle: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      communityMembers: true,
      communityJoinRequests: {
        where: { status: CommunityJoinRequestStatus.PENDING },
      },
    },
  },
} satisfies Prisma.CommunitySelect;

type TCommunity = Prisma.CommunityGetPayload<{
  select: typeof communitySelect;
}>;

type TMembershipSummary = {
  communityId: string;
  role: CommunityMemberRole;
};

type TJoinRequestSummary = {
  communityId: string;
  status: CommunityJoinRequestStatus;
};

export const mapCommunityCard = (
  community: TCommunity,
  myMembership?: TMembershipSummary,
  myJoinRequest?: TJoinRequestSummary
) => {
  return {
    id: community.id,
    title: community.title,
    subTitle: community.subTitle,
    image: community.image,
    memberCount: community._count.communityMembers,
    pendingRequestCount: community._count.communityJoinRequests,
    myRole: myMembership?.role ?? null,
    joinStatus: myJoinRequest?.status ?? null,
  };
};

export const getCommunityMembershipMaps = async (
  authId: string | undefined,
  communityIds: string[]
) => {
  const roleByCommunityId = new Map<string, TMembershipSummary>();
  const joinRequestByCommunityId = new Map<string, TJoinRequestSummary>();

  if (!authId || communityIds.length === 0) {
    return { roleByCommunityId, joinRequestByCommunityId };
  }

  const [memberships, joinRequests] = await Promise.all([
    prisma.communityMember.findMany({
      where: {
        memberAuthId: authId,
        communityId: { in: communityIds },
      },
      select: { communityId: true, role: true },
    }),
    prisma.communityJoinRequest.findMany({
      where: {
        memberAuthId: authId,
        communityId: { in: communityIds },
      },
      select: { communityId: true, status: true },
    }),
  ]);

  memberships.forEach(m => {
    roleByCommunityId.set(m.communityId, m);
  });
  joinRequests.forEach(r => {
    joinRequestByCommunityId.set(r.communityId, r);
  });

  return { roleByCommunityId, joinRequestByCommunityId };
};

export const ensureCommunityAdmin = async (
  communityId: string,
  authId: string
) => {
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { id: true, creatorId: true, image: true },
  });
  if (!community) throw new ApiError(404, "Community not found");

  if (community.creatorId === authId) {
    return community;
  }

  const membership = await prisma.communityMember.findUnique({
    where: {
      communityId_memberAuthId: {
        communityId,
        memberAuthId: authId,
      },
    },
    select: { role: true },
  });

  if (!membership || membership.role !== CommunityMemberRole.ADMIN) {
    throw new ApiError(403, "Not authorized");
  }

  return community;
};
