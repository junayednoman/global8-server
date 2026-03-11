import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { socketAuth } from "./auth";
import { registerChatEvents } from "./events/chat.events";
import { userRoom } from "./rooms";

const allowedOrigins = ["http://localhost:3000", "http://72.244.153.29:3000"];

export const initSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  const onlineUsers = new Map<string, number>();

  io.use(socketAuth);

  io.on("connection", socket => {
    const authId = socket.data.user?.id as string | undefined;
    console.log("Socket connected:", socket.data.user?.id);
    if (authId) {
      socket.join(userRoom(authId));
      const count = onlineUsers.get(authId) ?? 0;
      onlineUsers.set(authId, count + 1);
      if (count === 0) {
        io.emit("presence:update", { userId: authId, status: "online" });
      }
    }

    socket.emit("socket:ready", {
      success: true,
      message: "Authenticated",
      data: { authId: authId ?? null },
    });

    socket.on("presence:sync", (ack?: (data: { userIds: string[] }) => void) => {
      const userIds = Array.from(onlineUsers.keys());
      if (typeof ack === "function") return ack({ userIds });
      socket.emit("presence:sync", { userIds });
    });

    registerChatEvents(io, socket);

    socket.on("disconnect", () => {
      if (!authId) return;
      const count = onlineUsers.get(authId) ?? 0;
      if (count <= 1) {
        onlineUsers.delete(authId);
        io.emit("presence:update", { userId: authId, status: "offline" });
      } else {
        onlineUsers.set(authId, count - 1);
      }
    });
  });

  return io;
};
