import { TAuthUser, TRequest } from "../../interface/global.interface";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { ReactionService } from "./reaction.service";

const toggle = handleAsyncRequest(async (req: TRequest, res) => {
  const authId = (req.user as TAuthUser).id;
  const result = await ReactionService.toggle(authId, req.body);

  sendResponse(res, {
    message: result.reacted
      ? "Reaction added successfully!"
      : "Reaction removed successfully!",
    data: result,
  });
});

export const ReactionController = {
  toggle,
};
