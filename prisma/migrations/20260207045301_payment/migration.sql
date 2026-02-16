-- CreateEnum
CREATE TYPE "public"."PaymentPurpose" AS ENUM ('CLASS', 'EXCLUSIVE_CONTENT', 'PRODUCT', 'EVENT');

-- CreateTable
CREATE TABLE "public"."payment" (
    "id" TEXT NOT NULL,
    "payerId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "transactionId" TEXT NOT NULL,
    "purpose" "public"."PaymentPurpose" NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."payment" ADD CONSTRAINT "payment_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment" ADD CONSTRAINT "payment_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
