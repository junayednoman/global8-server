import { FileType } from "@prisma/client";

export type TSocketUser = {
  id: string;
  email: string;
  role: string;
};

export type TChatJoinPayload = {
  chatId: string;
};

export type TMessageSendPayload = {
  chatId: string;
  text?: string;
  file?: string;
  fileType?: FileType;
};

export type TMessageReadPayload = {
  chatId: string;
};

export type TMessageDeliveredPayload = {
  messageId: string;
};

export type TChatsDeliveredPayload = {
  chatIds?: string[];
};

export type TTypingPayload = {
  chatId: string;
};
