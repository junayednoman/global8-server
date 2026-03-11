import jwt, { Secret } from "jsonwebtoken";
import { Socket } from "socket.io";
import config from "../config";
import { TSocketUser } from "./types";

const extractToken = (socket: Socket) => {
  const authToken =
    typeof socket.handshake.auth?.token === "string"
      ? socket.handshake.auth.token
      : undefined;

  if (authToken) return authToken;

  const header =
    typeof socket.handshake.headers.authorization === "string"
      ? socket.handshake.headers.authorization
      : undefined;

  if (!header) return undefined;

  return header.startsWith("Bearer ") ? header.slice(7) : undefined;
};

export const socketAuth = (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = extractToken(socket);
    if (!token) return next(new Error("Unauthorized"));

    const decoded = jwt.verify(
      token,
      config.jwt.accessSecret as Secret
    ) as TSocketUser;

    socket.data.user = decoded;
    return next();
  } catch (error) {
    return next(new Error("Unauthorized"));
  }
};
