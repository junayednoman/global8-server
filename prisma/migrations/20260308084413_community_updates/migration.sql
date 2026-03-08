/*
  Warnings:

  - A unique constraint covering the columns `[communityId,memberAuthId]` on the table `community_join_request` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[communityId,memberAuthId]` on the table `community_member` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `community` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."CommunityJoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."community" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."community_join_request" ADD COLUMN     "status" "public"."CommunityJoinRequestStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "community_join_request_communityId_memberAuthId_key" ON "public"."community_join_request"("communityId", "memberAuthId");

-- CreateIndex
CREATE UNIQUE INDEX "community_member_communityId_memberAuthId_key" ON "public"."community_member"("communityId", "memberAuthId");
