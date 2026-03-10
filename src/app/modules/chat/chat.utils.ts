import { Prisma } from "@prisma/client";

export const chatSelect = Prisma.validator<Prisma.ChatSelect>()({
  id: true,
  type: true,
  communityId: true,
  lastMessage: true,
  createdAt: true,
  updatedAt: true,
  community: {
    select: {
      id: true,
      title: true,
      image: true,
    },
  },
  participants: {
    select: {
      authId: true,
      auth: {
        select: {
          id: true,
          profile: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
  },
});

export const messageSelect = Prisma.validator<Prisma.MessageSelect>()({
  id: true,
  chatId: true,
  senderId: true,
  text: true,
  file: true,
  fileType: true,
  status: true,
  seenBy: true,
  createdAt: true,
  updatedAt: true,
  sender: {
    select: {
      id: true,
      profile: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  },
});
