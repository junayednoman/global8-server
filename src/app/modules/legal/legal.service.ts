import prisma from "../../utils/prisma";
import { TUpdateLegal } from "./legal.validation";

const get = async () => {
  const legal = await prisma.legal.findFirst({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      privacyPolicy: true,
      termsCondition: true,
      aboutUs: true,
      updatedAt: true,
    },
  });

  return legal;
};

const upsert = async (payload: TUpdateLegal) => {
  const existing = await prisma.legal.findFirst({
    select: { id: true },
  });

  if (!existing) {
    return prisma.legal.create({
      data: {
        privacyPolicy: payload.privacyPolicy,
        termsCondition: payload.termsCondition,
        aboutUs: payload.aboutUs,
      },
      select: {
        id: true,
        privacyPolicy: true,
        termsCondition: true,
        aboutUs: true,
        updatedAt: true,
      },
    });
  }

  return prisma.legal.update({
    where: { id: existing.id },
    data: {
      privacyPolicy: payload.privacyPolicy,
      termsCondition: payload.termsCondition,
      aboutUs: payload.aboutUs,
    },
    select: {
      id: true,
      privacyPolicy: true,
      termsCondition: true,
      aboutUs: true,
      updatedAt: true,
    },
  });
};

export const LegalService = {
  get,
  upsert,
};
