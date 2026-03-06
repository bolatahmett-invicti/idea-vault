import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { all, run } from "../db.js";

const router = Router();

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

function getAllIdeasSummary() {
  return all("SELECT id, title, description, category, status, priority, tags, notes FROM ideas").map(i => ({
    ...i,
    tags: JSON.parse(i.tags),
  }));
}

const SYSTEM_PROMPT = `You are the IdeaVault AI Assistant — a helpful internal tool for a security engineering team at Invicti.

Your role:
- Help users brainstorm and refine project ideas
- Check if a proposed idea overlaps with existing ones in the vault
- Suggest improvements, missing features, or alternative approaches
- Provide technical insights on security tooling, API security, DAST, SAST, and DevSecOps
- Be concise and actionable — this is an engineering team, not a blog

You have access to the current ideas in the vault. When the user asks about existing ideas, reference them by name and provide specifics.

Current ideas in the vault:
{{IDEAS}}

Guidelines:
- If someone proposes a new idea, check for overlap with existing ones first
- Suggest concrete next steps when possible
- Be honest if an idea has weaknesses or risks
- Keep responses focused and under 300 words unless detail is explicitly requested`;

// GET /api/chat/history
router.get("/history", (_req, res) => {
  const messages = all("SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 50").reverse();
  res.json(messages);
});

// POST /api/chat
router.post("/", async (req, res) => {
  const client = getClient();
  if (!client) {
    return res.status(503).json({
      error: "ANTHROPIC_API_KEY not configured. Set it as an environment variable to enable AI chat.",
    });
  }

  const { message } = req.body;
  if (!message?.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  run("INSERT INTO chat_messages (role, content) VALUES ($role, $content)", {
    $role: "user",
    $content: message.trim(),
  });

  const ideas = getAllIdeasSummary();
  const systemPrompt = SYSTEM_PROMPT.replace("{{IDEAS}}", JSON.stringify(ideas, null, 2));

  const recentMessages = all(
    "SELECT role, content FROM chat_messages ORDER BY created_at DESC LIMIT 20"
  ).reverse();

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: recentMessages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    const assistantMessage = response.content[0].text;

    run("INSERT INTO chat_messages (role, content) VALUES ($role, $content)", {
      $role: "assistant",
      $content: assistantMessage,
    });

    res.json({ role: "assistant", content: assistantMessage });
  } catch (err) {
    console.error("Claude API error:", err.message);
    res.status(500).json({ error: `AI request failed: ${err.message}` });
  }
});

// DELETE /api/chat/history
router.delete("/history", (_req, res) => {
  run("DELETE FROM chat_messages");
  res.json({ success: true });
});

export default router;
