-- CreateEnum
CREATE TYPE "public"."ProductType" AS ENUM ('HELMET', 'PAD', 'ACCESSORY', 'SHOE');

-- AlterTable
ALTER TABLE "public"."product" ADD COLUMN     "type" "public"."ProductType" NOT NULL DEFAULT 'SHOE';
