import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import healthRoutes from "./routes/healthRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, message: "Too many requests from this IP, please try again later." }
});
app.use("/api", globalLimiter);

app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "NexusAI Backend API is running successfully. API endpoints are served under /api.",
    health: "/api/health"
  });
});

app.use("/api", healthRoutes);
app.use("/api", chatRoutes);
app.use("/api", authRoutes);
app.use("/api", conversationRoutes);
app.use("/api", agentRoutes);

app.use(errorHandler);

export default app;
