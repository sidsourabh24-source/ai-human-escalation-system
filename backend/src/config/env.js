import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  claudeApiKey: process.env.CLAUDE_API_KEY || "",
  claudeModel: process.env.CLAUDE_MODEL || "claude-3-5-sonnet-latest",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  agentAlertEmail: process.env.AGENT_ALERT_EMAIL || "",
  salesAlertEmail: process.env.SALES_ALERT_EMAIL || "",
  dbHost: process.env.DB_HOST || "localhost",
  dbUser: process.env.DB_USER || "ai_user",
  dbPass: process.env.DB_PASS || "ai_pass",
  dbName: process.env.DB_NAME || "ai_app",
  dbPort: Number(process.env.DB_PORT || 3306)
};
