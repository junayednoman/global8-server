import prisma from "../../utils/prisma";
import { resolveReactionTarget } from "./reaction.utils";
import { TToggleReaction } from "./reaction.validation";

const toggle = async (authId: string, payload: TToggleReaction) => {
  const target = await resolveReactionTarget(payload);

  const existing = await prisma.reaction.findFirst({
    where: {
      reactorId: authId,
      ...target.where,
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    const reactionCount = await prisma.reaction.count({ where: target.where });

    return {
      reacted: false,
      targetType: target.targetType,
      targetId: target.targetId,
      reactionCount,
    };
  }

  await prisma.reaction.create({
    data: {
      reactorId: authId,
      ...target.data,
    },
    select: { id: true },
  });

  const reactionCount = await prisma.reaction.count({ where: target.where });

  return {
    reacted: true,
    targetType: target.targetType,
    targetId: target.targetId,
    reactionCount,
  };
};

export const ReactionService = {
  toggle,
};
