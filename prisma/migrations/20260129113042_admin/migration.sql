-- CreateTable
CREATE TABLE "public"."admins" (
    "id" TEXT NOT NULL,
    "authId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "profileImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_authId_key" ON "public"."admins"("authId");

-- AddForeignKey
ALTER TABLE "public"."admins" ADD CONSTRAINT "admins_authId_fkey" FOREIGN KEY ("authId") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
