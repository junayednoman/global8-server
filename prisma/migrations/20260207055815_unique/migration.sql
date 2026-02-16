/*
  Warnings:

  - A unique constraint covering the columns `[transactionId]` on the table `payment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "payment_transactionId_key" ON "public"."payment"("transactionId");
