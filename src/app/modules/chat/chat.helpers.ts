import { ChatType, FileType } from "@prisma/client";
import ApiError from "../../classes/ApiError";
import prisma from "../../utils/prisma";

export const ensureCommunityMember = async (
  communityId: string,
  authId: string
) => {
  const member = await prisma.communityMember.findUnique({
    where: {
      communityId_memberAuthId: {
        communityId,
        memberAuthId: authId,
      },
    },
    select: { id: true },
  });
  if (!member) throw new ApiError(403, "You are not a community member");
};

export const ensureChatAccess = async (chatId: string, authId: string) => {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { id: true, type: true, communityId: true },
  });
  if (!chat) throw new ApiError(404, "Chat not found");

  if (chat.type === ChatType.COMMUNITY) {
    if (!chat.communityId) throw new ApiError(400, "Invalid community chat");
    await ensureCommunityMember(chat.communityId, authId);
  } else {
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        chatId_authId: {
          chatId,
          authId,
        },
      },
      select: { id: true },
    });
    if (!participant) throw new ApiError(403, "Not authorized for this chat");
  }

  return chat;
};

export const ensureParticipant = async (chatId: string, authId: string) => {
  await prisma.chatParticipant.createMany({
    data: [{ chatId, authId }],
    skipDuplicates: true,
  });
};

export const buildLastMessage = (text?: string, fileType?: FileType) => {
  return text ?? (fileType ? fileType.toLowerCase() : "file");
};
