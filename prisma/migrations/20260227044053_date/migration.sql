-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."EnrollmentStatus" ADD VALUE 'DENIED';
ALTER TYPE "public"."EnrollmentStatus" ADD VALUE 'CANCELED';

-- AlterTable
ALTER TABLE "public"."class" ALTER COLUMN "date" DROP NOT NULL;

-- DropEnum
DROP TYPE "public"."ClassPackageInterval";
