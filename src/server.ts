import { log } from "console";
import { createServer, Server } from "http";
import app from "./app/app";
import config from "./app/config";

let server: Server;

const main = () => {
  server = createServer(app);

  server.listen(config.port, () => {
    console.log(`Server running on port: ${config.port}`);
  });
};

main();

process.on("uncaughtException", error => {
  log(error);
  if (server) {
    server.close(() => {
      console.log("Server closed due to uncaught exception");
      process.exit(1);
    });
  }
});

process.on("unhandledRejection", error => {
  log(error);
  if (server) {
    server.close(() => {
      console.log("Server closed due to unhandled rejection");
      process.exit(1);
    });
  }
});
