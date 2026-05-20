import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { env } from "./config/env.js";
import { registerChatSocket } from "./sockets/chatSocket.js";
import { autoResolveStaleConversations } from "./services/conversationService.js";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.set("io", io);

registerChatSocket(io);

server.listen(env.port, () => {
  console.log(`Backend running on http://localhost:${env.port}`);
});

// Feature 1: Auto-resolve conversations that have been inactive for 7+ days
// Runs at startup and then every 6 hours
autoResolveStaleConversations();
setInterval(autoResolveStaleConversations, 6 * 60 * 60 * 1000);
