/*
  Warnings:

  - A unique constraint covering the columns `[paymentId]` on the table `class_enrollment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripePaymentIntentId]` on the table `payment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."class_enrollment" ADD COLUMN     "paymentId" TEXT;

-- AlterTable
ALTER TABLE "public"."payment" ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "stripePaymentIntentId" TEXT,
ADD COLUMN     "stripeRefundId" TEXT,
ADD COLUMN     "stripeSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "class_enrollment_paymentId_key" ON "public"."class_enrollment"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_stripePaymentIntentId_key" ON "public"."payment"("stripePaymentIntentId");

-- AddForeignKey
ALTER TABLE "public"."class_enrollment" ADD CONSTRAINT "class_enrollment_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
