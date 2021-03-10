import * as express from "express";
import * as path from "path";

import config from "./config";
import socket from "./socket";

const app = express();

app.use("/", express.static(path.join(__dirname, "..", "public")));

const server = app.listen(config.port, () => {
  console.log(`[SERVER] Listening on port ${config.port}`);
});

socket.startChatServer(server);
