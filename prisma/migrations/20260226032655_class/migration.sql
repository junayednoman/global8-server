/*
  Warnings:

  - The values [VIRTUAL] on the enum `ClassType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."DJEventStatus" AS ENUM ('UPCOMING', 'LIVE', 'ENDED');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."ClassType_new" AS ENUM ('VIRTUAL_RECORDED', 'VIRTUAL_LIVE', 'OFFLINE');
ALTER TABLE "public"."class" ALTER COLUMN "type" TYPE "public"."ClassType_new" USING ("type"::text::"public"."ClassType_new");
ALTER TYPE "public"."ClassType" RENAME TO "ClassType_old";
ALTER TYPE "public"."ClassType_new" RENAME TO "ClassType";
DROP TYPE "public"."ClassType_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."class" ADD COLUMN     "liveClassLink" TEXT,
ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "public"."dj_event" ADD COLUMN     "status" "public"."DJEventStatus" NOT NULL DEFAULT 'UPCOMING';
