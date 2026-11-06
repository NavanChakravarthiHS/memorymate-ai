import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { userContext } from "./middleware/userContext.js";
import chatRoutes from "./routes/chat.js";
import healthRoutes from "./routes/health.js";
import memoryRoutes from "./routes/memories.js";

const app = express();

app.use(
  cors({
    origin: env.corsOrigin.split(",").map((value) => value.trim()),
    allowedHeaders: ["Content-Type", "X-User-Id"],
  })
);
app.use(express.json({ limit: "1mb" }));
app.use((err, _req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON body.", code: "INVALID_JSON" });
  }
  next(err);
});
app.use(userContext);

app.use("/api/health", healthRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/memories", memoryRoutes);

app.use(notFound);
app.use(errorHandler);

export { app };

if (process.env.NODE_ENV !== "test") {
  app.listen(env.port, () => {
    console.log(`MemoryMate AI backend running on http://localhost:${env.port}`);
  });
}
