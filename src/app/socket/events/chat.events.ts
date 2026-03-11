import { ChatType } from "@prisma/client";
import { Server, Socket } from "socket.io";
import { ChatService } from "../../modules/chat/chat.service";
import prisma from "../../utils/prisma";
import { chatRoom, userRoom } from "../rooms";
import {
  TChatJoinPayload,
  TChatsDeliveredPayload,
  TMessageDeliveredPayload,
  TMessageReadPayload,
  TMessageSendPayload,
  TTypingPayload,
} from "../types";

const getParticipantIds = async (chatId: string) => {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { type: true, communityId: true },
  });
  if (!chat) return [];

  if (chat.type === ChatType.COMMUNITY && chat.communityId) {
    const members = await prisma.communityMember.findMany({
      where: { communityId: chat.communityId },
      select: { memberAuthId: true },
    });
    return members.map(member => member.memberAuthId);
  }

  const participants = await prisma.chatParticipant.findMany({
    where: { chatId },
    select: { authId: true },
  });
  return participants.map(participant => participant.authId);
};

export const registerChatEvents = (io: Server, socket: Socket) => {
  const authId = socket.data.user?.id as string | undefined;
  if (!authId) return;

  const respond = (
    eventName: string,
    ack: unknown,
    payload: { success: boolean; message: string; data?: any }
  ) => {
    if (typeof ack === "function") {
      return (ack as (response: typeof payload) => void)(payload);
    }
    socket.emit(`${eventName}:ack`, payload);
  };

  socket.on(
    "chat:join",
    async (
      payload: TChatJoinPayload,
      ack?: (response: {
        success: boolean;
        message: string;
        data?: any;
      }) => void
    ) => {
      try {
        if (!payload?.chatId) {
          return respond("chat:join", ack, {
            success: false,
            message: "chatId is required",
          });
        }
        const chat = await ChatService.getSingle(authId, payload.chatId);
        socket.join(chatRoom(payload.chatId));
        return respond("chat:join", ack, {
          success: true,
          message: "Joined chat successfully",
          data: { chatId: payload.chatId, chat },
        });
      } catch (error: any) {
        return respond("chat:join", ack, {
          success: false,
          message: error?.message || "Failed to join chat",
        });
      }
    }
  );

  socket.on(
    "chat:leave",
    (
      payload: TChatJoinPayload,
      ack?: (response: {
        success: boolean;
        message: string;
        data?: any;
      }) => void
    ) => {
      if (!payload?.chatId) {
        return respond("chat:leave", ack, {
          success: false,
          message: "chatId is required",
        });
      }
      socket.leave(chatRoom(payload.chatId));
      return respond("chat:leave", ack, {
        success: true,
        message: "Left chat successfully",
        data: { chatId: payload.chatId },
      });
    }
  );

  socket.on(
    "message:send",
    async (
      payload: TMessageSendPayload,
      ack?: (response: {
        success: boolean;
        message: string;
        data?: any;
      }) => void
    ) => {
      try {
        if (!payload?.chatId) {
          return respond("message:send", ack, {
            success: false,
            message: "chatId is required",
          });
        }
        const message = await ChatService.sendMessage(authId, payload.chatId, {
          text: payload.text,
          file: payload.file,
          fileType: payload.fileType,
        });

        io.to(chatRoom(payload.chatId)).emit("message:new", message);

        const participantIds = await getParticipantIds(payload.chatId);
        participantIds.forEach(participantId => {
          io.to(userRoom(participantId)).emit("chat:updated", {
            chatId: payload.chatId,
          });
        });

        return respond("message:send", ack, {
          success: true,
          message: "Message sent successfully",
          data: message,
        });
      } catch (error: any) {
        return respond("message:send", ack, {
          success: false,
          message: error?.message || "Failed to send message",
        });
      }
    }
  );

  socket.on(
    "message:read",
    async (
      payload: TMessageReadPayload,
      ack?: (response: {
        success: boolean;
        message: string;
        data?: any;
      }) => void
    ) => {
      try {
        if (!payload?.chatId) {
          return respond("message:read", ack, {
            success: false,
            message: "chatId is required",
          });
        }
        const result = await ChatService.markRead(authId, payload.chatId);

        io.to(chatRoom(payload.chatId)).emit("message:read", {
          chatId: payload.chatId,
          readerId: authId,
          updated: result.updated,
        });

        const participantIds = await getParticipantIds(payload.chatId);
        participantIds.forEach(participantId => {
          io.to(userRoom(participantId)).emit("chat:updated", {
            chatId: payload.chatId,
          });
        });

        return respond("message:read", ack, {
          success: true,
          message: "Messages marked as read",
          data: { chatId: payload.chatId, updated: result.updated },
        });
      } catch (error: any) {
        return respond("message:read", ack, {
          success: false,
          message: error?.message || "Failed to mark messages as read",
        });
      }
    }
  );

  socket.on(
    "typing:start",
    async (
      payload: TTypingPayload,
      ack?: (response: {
        success: boolean;
        message: string;
        data?: any;
      }) => void
    ) => {
      try {
        if (!payload?.chatId) {
          return respond("typing:start", ack, {
            success: false,
            message: "chatId is required",
          });
        }
        await ChatService.getSingle(authId, payload.chatId);
        socket.to(chatRoom(payload.chatId)).emit("typing:start", {
          chatId: payload.chatId,
          userId: authId,
        });
        return respond("typing:start", ack, {
          success: true,
          message: "Typing started",
          data: { chatId: payload.chatId },
        });
      } catch (error: any) {
        return respond("typing:start", ack, {
          success: false,
          message: error?.message || "Failed to send typing start",
        });
      }
    }
  );

  socket.on(
    "typing:stop",
    async (
      payload: TTypingPayload,
      ack?: (response: {
        success: boolean;
        message: string;
        data?: any;
      }) => void
    ) => {
      try {
        if (!payload?.chatId) {
          return respond("typing:stop", ack, {
            success: false,
            message: "chatId is required",
          });
        }
        await ChatService.getSingle(authId, payload.chatId);
        socket.to(chatRoom(payload.chatId)).emit("typing:stop", {
          chatId: payload.chatId,
          userId: authId,
        });
        return respond("typing:stop", ack, {
          success: true,
          message: "Typing stopped",
          data: { chatId: payload.chatId },
        });
      } catch (error: any) {
        return respond("typing:stop", ack, {
          success: false,
          message: error?.message || "Failed to send typing stop",
        });
      }
    }
  );

  socket.on(
    "chats:delivered",
    async (
      payload: TChatsDeliveredPayload,
      ack?: (response: {
        success: boolean;
        message: string;
        data?: any;
      }) => void
    ) => {
      try {
        const requestedChatIds = Array.isArray(payload?.chatIds)
          ? payload.chatIds.filter(Boolean)
          : [];

        const communityMemberships = await prisma.communityMember.findMany({
          where: { memberAuthId: authId },
          select: { communityId: true },
        });
        const communityIds = communityMemberships.map(item => item.communityId);

        const participantChats = await prisma.chatParticipant.findMany({
          where: { authId },
          select: { chatId: true },
        });
        const participantChatIds = participantChats.map(item => item.chatId);

        const accessibleChats = await prisma.chat.findMany({
          where: {
            OR: [
              { id: { in: participantChatIds } },
              ...(communityIds.length
                ? [{ communityId: { in: communityIds } }]
                : []),
            ],
            ...(requestedChatIds.length
              ? { id: { in: requestedChatIds } }
              : {}),
          },
          select: { id: true },
        });

        const validChatIds = accessibleChats.map(chat => chat.id);
        if (!validChatIds.length) {
          return respond("chats:delivered", ack, {
            success: true,
            message: "No accessible chats",
            data: { updated: 0 },
          });
        }

        const pending = await prisma.message.findMany({
          where: {
            chatId: { in: validChatIds },
            senderId: { not: authId },
            status: "SENT",
          },
          select: { id: true, senderId: true },
        });

        if (!pending.length) {
          return respond("chats:delivered", ack, {
            success: true,
            message: "No pending messages",
            data: { updated: 0 },
          });
        }

        await prisma.message.updateMany({
          where: {
            chatId: { in: validChatIds },
            senderId: { not: authId },
            status: "SENT",
          },
          data: { status: "DELIVERED" },
        });

        const senderIds = new Set<string>();
        pending.forEach(item => senderIds.add(item.senderId));

        senderIds.forEach(senderId => {
          io.to(userRoom(senderId)).emit("chat:updated", {
            reason: "delivered",
          });
        });

        return respond("chats:delivered", ack, {
          success: true,
          message: "Delivered status updated",
          data: { updated: pending.length },
        });
      } catch (error: any) {
        return respond("chats:delivered", ack, {
          success: false,
          message: error?.message || "Failed to update delivered status",
        });
      }
    }
  );

  socket.on(
    "message:delivered",
    async (
      payload: TMessageDeliveredPayload,
      ack?: (response: {
        success: boolean;
        message: string;
        data?: any;
      }) => void
    ) => {
      try {
        if (!payload?.messageId) {
          return respond("message:delivered", ack, {
            success: false,
            message: "messageId is required",
          });
        }

        const message = await prisma.message.findUnique({
          where: { id: payload.messageId },
          select: { id: true, chatId: true, senderId: true, status: true },
        });
        if (!message) {
          return respond("message:delivered", ack, {
            success: false,
            message: "Message not found",
          });
        }

        await ChatService.getSingle(authId, message.chatId);

        if (message.senderId === authId) {
          return respond("message:delivered", ack, {
            success: true,
            message: "Delivered status ignored for sender",
            data: { messageId: message.id, status: message.status },
          });
        }

        if (message.status === "SENT") {
          await prisma.message.update({
            where: { id: message.id },
            data: { status: "DELIVERED" },
          });
        }

        const updated = await prisma.message.findUnique({
          where: { id: message.id },
          select: { status: true },
        });

        io.to(userRoom(message.senderId)).emit("message:status", {
          messageId: message.id,
          status: updated?.status ?? message.status,
        });

        return respond("message:delivered", ack, {
          success: true,
          message: "Delivered status updated",
          data: {
            messageId: message.id,
            status: updated?.status ?? message.status,
          },
        });
      } catch (error: any) {
        return respond("message:delivered", ack, {
          success: false,
          message: error?.message || "Failed to update delivered status",
        });
      }
    }
  );
};
