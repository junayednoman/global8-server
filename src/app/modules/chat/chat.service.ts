import { ChatType, FileType, Prisma } from "@prisma/client";
import ApiError from "../../classes/ApiError";
import prisma from "../../utils/prisma";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import { TCreateChat, TSendMessage } from "./chat.validation";
import { chatSelect, messageSelect } from "./chat.utils";
import {
  buildLastMessage,
  ensureChatAccess,
  ensureParticipant,
} from "./chat.helpers";

const create = async (authId: string, payload: TCreateChat) => {
  if (payload.recipientId) {
    if (authId === payload.recipientId) {
      throw new ApiError(400, "You cannot create a chat with yourself");
    }

    const recipient = await prisma.auth.findUnique({
      where: { id: payload.recipientId },
      select: { id: true },
    });
    if (!recipient) throw new ApiError(404, "Invalid recipientId!");

    const existing = await prisma.chat.findFirst({
      where: {
        type: ChatType.INDIVIDUAL,
        participants: {
          some: { authId },
        },
        AND: [
          { participants: { some: { authId: payload.recipientId } } },
          {
            participants: {
              every: { authId: { in: [authId, payload.recipientId] } },
            },
          },
        ],
      },
      select: chatSelect,
    });

    if (existing) return existing;

    return prisma.chat.create({
      data: {
        type: ChatType.INDIVIDUAL,
        participants: {
          createMany: {
            data: [{ authId }, { authId: payload.recipientId }],
          },
        },
      },
      select: chatSelect,
    });
  }
  throw new ApiError(400, "recipientId is required");
};

const getAll = async (
  authId: string,
  options: TPaginationOptions & { searchTerm?: string }
) => {
  const page = Number(options.page ?? 1);
  const limit = Number(options.limit ?? 20);
  if (!Number.isFinite(page) || page < 1)
    throw new ApiError(400, "Invalid page");
  if (!Number.isFinite(limit) || limit < 1 || limit > 100)
    throw new ApiError(400, "Invalid limit");

  const searchTerm =
    typeof options.searchTerm === "string"
      ? options.searchTerm.trim()
      : undefined;

  const communityMemberships = await prisma.communityMember.findMany({
    where: { memberAuthId: authId },
    select: { communityId: true },
  });
  const communityIds = communityMemberships.map(item => item.communityId);

  const searchConditions =
    searchTerm && searchTerm.length
      ? [
          {
            community: {
              is: {
                OR: [
                  {
                    title: {
                      contains: searchTerm,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                  {
                    subTitle: {
                      contains: searchTerm,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                ],
              },
            },
          },
          {
            participants: {
              some: {
                auth: {
                  profile: {
                    name: {
                      contains: searchTerm,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                },
              },
            },
          },
        ]
      : [];

  const whereConditions = {
    OR: [
      { participants: { some: { authId } } },
      ...(communityIds.length ? [{ communityId: { in: communityIds } }] : []),
    ],
    ...(searchConditions.length ? { AND: [{ OR: searchConditions }] } : {}),
  };

  const {
    page: currentPage,
    take,
    skip,
  } = calculatePagination({
    page,
    limit,
    sortBy: "updatedAt",
    orderBy: "desc",
  });

  const chats = await prisma.chat.findMany({
    where: whereConditions,
    skip,
    take,
    orderBy: { updatedAt: "desc" },
    select: chatSelect,
  });

  const total = await prisma.chat.count({ where: whereConditions });

  const chatIds = chats.map(chat => chat.id);
  if (chatIds.length) {
    await prisma.chatParticipant.createMany({
      data: chatIds.map(chatId => ({ chatId, authId })),
      skipDuplicates: true,
    });
  }

  const lastMessages = await Promise.all(
    chatIds.map(chatId =>
      prisma.message.findFirst({
        where: { chatId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          senderId: true,
          text: true,
          file: true,
          fileType: true,
          status: true,
          seenBy: true,
          createdAt: true,
        },
      })
    )
  );

  const unreadCounts = await Promise.all(
    chatIds.map(chatId =>
      prisma.message.count({
        where: {
          chatId,
          senderId: { not: authId },
          NOT: { seenBy: { has: authId } },
        },
      })
    )
  );

  return {
    meta: { page: currentPage, limit: take, total },
    chats: chats.map((chat, index) => {
      const otherParticipant = chat.participants.find(
        participant => participant.authId !== authId
      );
      const lastMessage = lastMessages[index];
      const lastMessageContent =
        lastMessage?.text ??
        (lastMessage?.fileType ? lastMessage.fileType.toLowerCase() : null);
      const isMine = lastMessage?.senderId === authId;
      const hasBeenSeen = lastMessage ? lastMessage.seenBy.length > 0 : false;
      const readStatus = lastMessage
        ? isMine
          ? hasBeenSeen
            ? "READ"
            : "SENT"
          : lastMessage.seenBy.includes(authId)
            ? "READ"
            : "DELIVERED"
        : null;

      return {
        id: chat.id,
        type: chat.type,
        community: chat.community,
        lastMessage: lastMessage
          ? {
              content: lastMessageContent,
              file: lastMessage.file,
              fileType: lastMessage.fileType,
              senderId: lastMessage.senderId,
              status: readStatus,
              date: lastMessage.createdAt,
              isMine,
            }
          : null,
        updatedAt: chat.updatedAt,
        unreadCount: unreadCounts[index],
        participant:
          chat.type === ChatType.INDIVIDUAL
            ? {
                id: otherParticipant?.auth?.id,
                name: otherParticipant?.auth?.profile?.name ?? null,
                image: otherParticipant?.auth?.profile?.image ?? null,
              }
            : null,
      };
    }),
  };
};

const getSingle = async (authId: string, chatId: string) => {
  await ensureChatAccess(chatId, authId);

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: chatSelect,
  });
  if (!chat) throw new ApiError(404, "Chat not found");

  await ensureParticipant(chatId, authId);

  return chat;
};

const getMessages = async (
  authId: string,
  chatId: string,
  options: TPaginationOptions
) => {
  await ensureChatAccess(chatId, authId);
  await ensureParticipant(chatId, authId);

  const page = Number(options.page ?? 1);
  const limit = Number(options.limit ?? 20);
  if (!Number.isFinite(page) || page < 1)
    throw new ApiError(400, "Invalid page");
  if (!Number.isFinite(limit) || limit < 1 || limit > 100)
    throw new ApiError(400, "Invalid limit");

  const {
    page: currentPage,
    take,
    skip,
  } = calculatePagination({
    page,
    limit,
    sortBy: "createdAt",
    orderBy: "desc",
  });

  const messages = await prisma.message.findMany({
    where: { chatId },
    skip,
    take,
    orderBy: { createdAt: "asc" },
    select: messageSelect,
  });

  const total = await prisma.message.count({ where: { chatId } });

  return {
    meta: { page: currentPage, limit: take, total },
    messages: messages.map(message => ({
      ...message,
      isEdited: message.updatedAt.getTime() > message.createdAt.getTime(),
      isMine: message.senderId === authId,
    })),
  };
};

const sendMessage = async (
  authId: string,
  chatId: string,
  payload: TSendMessage
) => {
  await ensureChatAccess(chatId, authId);
  await ensureParticipant(chatId, authId);

  const lastMessage = buildLastMessage(payload.text, payload.fileType);

  const message = await prisma.$transaction(async tx => {
    const created = await tx.message.create({
      data: {
        chatId,
        senderId: authId,
        text: payload.text,
        file: payload.file,
        fileType: payload.fileType as FileType | undefined,
      },
      select: messageSelect,
    });

    await tx.chat.update({
      where: { id: chatId },
      data: { lastMessage },
    });

    return created;
  });

  return {
    ...message,
    isEdited: message.updatedAt.getTime() > message.createdAt.getTime(),
    isMine: message.senderId === authId,
  };
};

const markRead = async (authId: string, chatId: string) => {
  await ensureChatAccess(chatId, authId);
  await ensureParticipant(chatId, authId);

  const messages = await prisma.message.findMany({
    where: {
      chatId,
      senderId: { not: authId },
      NOT: { seenBy: { has: authId } },
    },
    select: { id: true },
  });

  await prisma.$transaction(async tx => {
    await tx.chatParticipant.update({
      where: {
        chatId_authId: { chatId, authId },
      },
      data: { lastReadAt: new Date() },
    });

    for (const message of messages) {
      await tx.message.update({
        where: { id: message.id },
        data: { seenBy: { push: authId } },
      });
    }
  });

  return { updated: messages.length };
};

export const ChatService = {
  create,
  getAll,
  getSingle,
  getMessages,
  sendMessage,
  markRead,
};
