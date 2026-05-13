import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  dbHost: process.env.DB_HOST || process.env.MYSQL_HOST || "localhost",
  dbPort: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
  dbUser: process.env.DB_USER || process.env.MYSQL_USER || "root",
  dbPass: process.env.DB_PASS || process.env.MYSQL_PASSWORD || "",
  dbName: process.env.DB_NAME || process.env.MYSQL_DATABASE || "ai_app",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  agentAlertEmail: process.env.AGENT_ALERT_EMAIL || "",
  salesAlertEmail: process.env.SALES_ALERT_EMAIL || ""
};
