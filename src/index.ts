import express from "express";
import cors from "cors";
import { validateRequiredFields } from "./middleware/validation.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: { title: "ChronoPay API", version: "1.0.0" },
  },
  apis: ["./src/index.ts"], // adjust if needed
};

const specs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the service
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: chronopay-backend
 *                 timestamp:
 *                   type: string
 *                   example: 2023-10-01T12:00:00.000Z
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 */
app.get("/health", (_req, res) => {
  res.json({ 
    status: "ok", 
    service: "chronopay-backend",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

/**
 * @swagger
 * /ready:
 *   get:
 *     summary: Readiness check endpoint
 *     description: Returns the readiness status of the service
 *     responses:
 *       200:
 *         description: Service is ready to accept traffic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ready
 *                 service:
 *                   type: string
 *                   example: chronopay-backend
 *                 timestamp:
 *                   type: string
 *                   example: 2023-10-01T12:00:00.000Z
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 */
app.get("/ready", (_req, res) => {
  res.json({ 
    status: "ready", 
    service: "chronopay-backend",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

/**
 * @swagger
 * /live:
 *   get:
 *     summary: Liveness check endpoint
 *     description: Returns the liveness status of the service
 *     responses:
 *       200:
 *         description: Service is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: alive
 *                 service:
 *                   type: string
 *                   example: chronopay-backend
 *                 timestamp:
 *                   type: string
 *                   example: 2023-10-01T12:00:00.000Z
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 */
app.get("/live", (_req, res) => {
  res.json({ 
    status: "alive", 
    service: "chronopay-backend",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

app.get("/api/v1/slots", (_req, res) => {
  res.json({ slots: [] });
});

app.post(
  "/api/v1/slots",
  validateRequiredFields(["professional", "startTime", "endTime"]),
  (req, res) => {
    const { professional, startTime, endTime } = req.body;

    res.status(201).json({
      success: true,
      slot: {
        id: 1,
        professional,
        startTime,
        endTime,
      },
    });
  },
);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`ChronoPay API listening on http://localhost:${PORT}`);
  });
}

export default app;
