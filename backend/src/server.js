import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { env } from "./config/env.js";
import { registerChatSocket } from "./sockets/chatSocket.js";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.frontendUrl,
    methods: ["GET", "POST"]
  }
});

registerChatSocket(io);

server.listen(env.port, () => {
  console.log(`Backend running on http://localhost:${env.port}`);
});
