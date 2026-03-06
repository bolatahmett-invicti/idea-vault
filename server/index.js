import express from "express";
import cors from "cors";
import ideasRouter from "./routes/ideas.js";
import chatRouter from "./routes/chat.js";
import "./seed.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/ideas", ideasRouter);
app.use("/api/chat", chatRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`IdeaVault API running on http://localhost:${PORT}`);
});
