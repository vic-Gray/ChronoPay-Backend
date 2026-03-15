import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "chronopay-backend" });
});

app.get("/api/v1/slots", (_req, res) => {
  res.json({ slots: [] });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`ChronoPay API listening on http://localhost:${PORT}`);
  });
}

export default app;
