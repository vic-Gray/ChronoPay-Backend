import express from "express";
import cors from "cors";
import { logInfo } from "./utils/logger.js";
import {
  createRequestLogger,
  errorLoggerMiddleware,
} from "./middleware/requestLogger.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

// Request logging middleware (must be first)
app.use(createRequestLogger());

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  const healthStatus = { status: "ok", service: "chronopay-backend" };
  logInfo("Health check endpoint called", { endpoint: "/health" });
  res.json(healthStatus);
});

app.get("/api/v1/slots", (_req, res) => {
  logInfo("Slots endpoint called", { endpoint: "/api/v1/slots" });
  res.json({ slots: [] });
});

// Error handling middleware (must be last)
app.use(errorLoggerMiddleware);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    logInfo(`ChronoPay API listening on http://localhost:${PORT}`, {
      port: PORT,
      environment: process.env.NODE_ENV || "development",
    });
  });
}

export default app;
