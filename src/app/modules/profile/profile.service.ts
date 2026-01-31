import { TFile } from "../../interface/file.interface";
import { deleteFromS3, uploadToS3 } from "../../utils/awss3";
import prisma from "../../utils/prisma";
import { TProfileFiles } from "./interface.profile";
import { TUpdateProfilePayload } from "./profile.validation";

const getMyProfile = async (authId: string) => {
  const profile = await prisma.profile.findUnique({
    where: { authId },
    select: {
      id: true,
      name: true,
      image: true,
      coverImage: true,
      bio: true,
      interests: true,
      socialLinks: true,
    },
  });

  return profile;
};

const updateProfile = async (
  authId: string,
  payload: TUpdateProfilePayload,
  files: TProfileFiles
) => {
  const profile = await prisma.profile.findUnique({
    where: { authId },
  });
  if (files.image) {
    payload.image = await uploadToS3(files.image[0] as TFile);
  }

  if (files.coverImage) {
    payload.coverImage = await uploadToS3(files.coverImage[0] as TFile);
  }
  payload.authId = authId;
  const result = await prisma.profile.upsert({
    where: { authId },
    create: payload,
    update: payload,
  });

  if (result) {
    if (profile?.image && payload.image)
      await deleteFromS3(profile?.image as string);
    if (profile?.coverImage && payload.coverImage)
      await deleteFromS3(profile?.coverImage as string);
  }
  return result;
};

export const ProfileService = {
  getMyProfile,
  updateProfile,
};
