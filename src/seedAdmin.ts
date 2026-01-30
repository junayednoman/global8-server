import prisma from "./app/utils/prisma";
import config from "./app/config";
import bcrypt from "bcrypt";
import { LoginProvider, UserRole, UserStatus } from "@prisma/client";

const seedAdmin = async () => {
  try {
    const exist = await prisma.auth.findUnique({
      where: {
        email: config.admin.email,
        role: UserRole.ADMIN,
      },
    });

    if (exist) return console.log("Admin already exists");

    const hashedPass = await bcrypt.hash(config.admin.password as string, 10);
    await prisma.$transaction(async tn => {
      const auth = await tn.auth.create({
        data: {
          email: config.admin.email as string,
          password: hashedPass,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          loginProvider: LoginProvider.EMAIL,
        },
      });

      await tn.admin.create({
        data: {
          authId: auth.id,
          name: "Admin",
        },
      });
    });
    console.log("Admin created");
  } catch (error) {
    console.log(error);
  }
};

seedAdmin();
