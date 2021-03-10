import * as WebSocket from "ws";
import * as http from "http";

import { v4 as uuid } from "uuid";

interface ChatClient {
  id: string;
  ws: WebSocket;
  username: string;
  isAuthenticated: boolean;
}

interface ClientList {
  [id: string]: ChatClient;
}

let wss: WebSocket.Server;

let clients: ClientList = {};

function startChatServer(server: http.Server) {
  wss = new WebSocket.Server({ path: "/chat", server });

  wss.on("connection", (ws) => {
    connectionHandler(ws);
  });

  console.log("[CHAT] Ready");
}

function broadcast(data: string, exceptID: string[]) {
  for (var [key, value] of Object.entries(clients)) {
    if (!exceptID.includes(key) && value.isAuthenticated) {
      value.ws.send(data);
    }
  }
}

function connectionHandler(ws: WebSocket) {
  const id = uuid();

  const client: ChatClient = {
    id,
    ws,
    username: "",
    isAuthenticated: false,
  };

  clients[id] = client;

  // Setup handlers
  ws.on("message", (data) => {
    messageHandler(client.id, data);
  });

  ws.on("close", () => {
    disconnectionHandler(client.id);
  });

  console.log(`[CHAT] Connection ${id}`);

  // Request authentication
  ws.send("auth");
}

function messageHandler(id: string, data: WebSocket.Data) {
  const client = clients[id];

  // Check if it is a string
  const dataString = data as string;
  if (!dataString) return;

  if (!client.isAuthenticated) {
    // Authenticate client
    const payload = dataString.split(" ");
    payload.splice(0, 1);

    const username = payload.join(" ");
    client.username = username;
    client.isAuthenticated = true;
    client.ws.send("connected");

    const bPayload = JSON.stringify({
      message: `${client.username} joined the room`,
      username: "SERVER",
    });
    broadcast(`message ${bPayload}`, []);

    return;
  }

  const payload = JSON.stringify({
    message: data,
    username: client.username,
  });

  broadcast(`message ${payload}`, []);
}

function disconnectionHandler(id: string) {
  const client = clients[id];

  const payload = JSON.stringify({
    message: `${client.username} left the room`,
    username: "SERVER",
  });
  broadcast(`message ${payload}`, [id]);

  console.log(`[CHAT] Disconnection ${id}`);
}

export default { startChatServer };
