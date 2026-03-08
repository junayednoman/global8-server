/*
  Warnings:

  - A unique constraint covering the columns `[communityId]` on the table `chat` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `chat` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ');

-- AlterTable
ALTER TABLE "public"."chat" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."message" ADD COLUMN     "status" "public"."MessageStatus" NOT NULL DEFAULT 'SENT';

-- CreateTable
CREATE TABLE "public"."chat_participant" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "authId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "chat_participant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_participant_authId_idx" ON "public"."chat_participant"("authId");

-- CreateIndex
CREATE INDEX "chat_participant_chatId_idx" ON "public"."chat_participant"("chatId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_participant_chatId_authId_key" ON "public"."chat_participant"("chatId", "authId");

-- CreateIndex
CREATE INDEX "chat_type_idx" ON "public"."chat"("type");

-- CreateIndex
CREATE UNIQUE INDEX "chat_communityId_key" ON "public"."chat"("communityId");

-- CreateIndex
CREATE INDEX "message_chatId_createdAt_idx" ON "public"."message"("chatId", "createdAt");

-- CreateIndex
CREATE INDEX "message_senderId_idx" ON "public"."message"("senderId");

-- AddForeignKey
ALTER TABLE "public"."chat_participant" ADD CONSTRAINT "chat_participant_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_participant" ADD CONSTRAINT "chat_participant_authId_fkey" FOREIGN KEY ("authId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
