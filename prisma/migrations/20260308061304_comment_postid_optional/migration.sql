-- DropForeignKey
ALTER TABLE "public"."comment" DROP CONSTRAINT "comment_postId_fkey";

-- AlterTable
ALTER TABLE "public"."comment" ALTER COLUMN "postId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."comment" ADD CONSTRAINT "comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
