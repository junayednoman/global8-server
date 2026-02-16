import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { EventService } from "./event.service";
import { TAuthUser, TRequest } from "../../interface/global.interface";
import pick from "../../utils/pick";

const createEvent = handleAsyncRequest(async (req: TRequest, res) => {
  const creatorId = (req.user as TAuthUser).id;

  const result = await EventService.createEvent(
    creatorId,
    req.body,
    req.files as any
  );

  sendResponse(res, {
    status: 201,
    message: "Event created successfully!",
    data: result,
  });
});

const updateEvent = handleAsyncRequest(async (req: TRequest, res) => {
  const creatorId = (req.user as TAuthUser).id;

  const result = await EventService.updateEvent(
    req.params.id as string,
    creatorId,
    req.body,
    req.files as any
  );

  sendResponse(res, {
    message: "Event updated successfully!",
    data: result,
  });
});

const getEvents = handleAsyncRequest(async (req, res) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const result = await EventService.getAll(options, req.query);
  sendResponse(res, {
    message: "Events retrieved successfully!",
    data: result,
  });
});

const getEvent = handleAsyncRequest(async (req, res) => {
  sendResponse(res, {
    message: "Event retrieved successfully!",
    data: await EventService.getSingle(req.params.id as string),
  });
});

export const EventController = {
  createEvent,
  updateEvent,
  getEvents,
  getEvent,
};
