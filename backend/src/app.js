import express from "express";
import cors from "cors";
import healthRoutes from "./routes/healthRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true
  })
);
app.use(express.json());

app.use("/api", healthRoutes);
app.use("/api", chatRoutes);
app.use("/api", authRoutes);
app.use("/api", conversationRoutes);

app.use(errorHandler);

export default app;
