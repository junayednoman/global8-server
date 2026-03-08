/*
  Warnings:

  - The values [DELIVERED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[reactorId,postId]` on the table `reaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reactorId,commentId]` on the table `reaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `content` to the `comment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."OrderStatus_new" AS ENUM ('PROCESSING', 'READY_TO_SHIP', 'SHIPPED');
ALTER TABLE "public"."orders" ALTER COLUMN "status" TYPE "public"."OrderStatus_new" USING ("status"::text::"public"."OrderStatus_new");
ALTER TYPE "public"."OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "public"."OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."reaction" DROP CONSTRAINT "reaction_postId_fkey";

-- AlterTable
ALTER TABLE "public"."comment" ADD COLUMN     "content" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."reaction" ALTER COLUMN "postId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "comment_postId_idx" ON "public"."comment"("postId");

-- CreateIndex
CREATE INDEX "comment_parentCommentId_idx" ON "public"."comment"("parentCommentId");

-- CreateIndex
CREATE INDEX "comment_reactorId_idx" ON "public"."comment"("reactorId");

-- CreateIndex
CREATE INDEX "reaction_postId_idx" ON "public"."reaction"("postId");

-- CreateIndex
CREATE INDEX "reaction_commentId_idx" ON "public"."reaction"("commentId");

-- CreateIndex
CREATE INDEX "reaction_reactorId_idx" ON "public"."reaction"("reactorId");

-- CreateIndex
CREATE UNIQUE INDEX "reaction_reactorId_postId_key" ON "public"."reaction"("reactorId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "reaction_reactorId_commentId_key" ON "public"."reaction"("reactorId", "commentId");

-- AddForeignKey
ALTER TABLE "public"."reaction" ADD CONSTRAINT "reaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
