-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."OrderPaymentStatus" ADD VALUE 'PENDING';
ALTER TYPE "public"."OrderPaymentStatus" ADD VALUE 'FAILED';
ALTER TYPE "public"."OrderPaymentStatus" ADD VALUE 'REFUNDED';

-- AlterEnum
ALTER TYPE "public"."OrderStatus" ADD VALUE 'SHIPPED';

-- DropForeignKey
ALTER TABLE "public"."payment" DROP CONSTRAINT "payment_receiverId_fkey";

-- AlterTable
ALTER TABLE "public"."order_item" ADD COLUMN     "productImage" TEXT,
ADD COLUMN     "productTitle" TEXT,
ADD COLUMN     "vendorId" TEXT;

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."payment" ADD COLUMN     "orderId" TEXT,
ALTER COLUMN "receiverId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."payment" ADD CONSTRAINT "payment_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."auth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment" ADD CONSTRAINT "payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
