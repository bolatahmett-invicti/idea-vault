import { Router } from "express";
import { all, get, run } from "../db.js";

const router = Router();

// GET /api/ideas
router.get("/", (req, res) => {
  const { category, status, priority, search, tag, sort } = req.query;

  let sql = "SELECT * FROM ideas WHERE 1=1";
  const params = {};

  if (category && category !== "All") {
    sql += " AND category = $category";
    params.$category = category;
  }
  if (status && status !== "All") {
    sql += " AND status = $status";
    params.$status = status;
  }
  if (priority && priority !== "All") {
    sql += " AND priority = $priority";
    params.$priority = priority;
  }
  if (search) {
    sql += " AND (title LIKE $search OR description LIKE $search OR tags LIKE $search)";
    params.$search = `%${search}%`;
  }
  if (tag) {
    sql += " AND tags LIKE $tag";
    params.$tag = `%"${tag}"%`;
  }

  switch (sort) {
    case "date-asc": sql += " ORDER BY date ASC"; break;
    case "priority": sql += " ORDER BY CASE priority WHEN 'High' THEN 0 WHEN 'Medium' THEN 1 WHEN 'Low' THEN 2 END"; break;
    case "title": sql += " ORDER BY title ASC"; break;
    default: sql += " ORDER BY date DESC"; break;
  }

  const ideas = all(sql, params).map(row => ({
    ...row,
    tags: JSON.parse(row.tags),
  }));

  res.json(ideas);
});

// GET /api/ideas/stats
router.get("/stats", (_req, res) => {
  const stats = {
    total: get("SELECT COUNT(*) as c FROM ideas")?.c || 0,
    ideas: get("SELECT COUNT(*) as c FROM ideas WHERE status = 'Idea'")?.c || 0,
    active: get("SELECT COUNT(*) as c FROM ideas WHERE status = 'In Progress'")?.c || 0,
    done: get("SELECT COUNT(*) as c FROM ideas WHERE status = 'Completed'")?.c || 0,
    live: get("SELECT COUNT(*) as c FROM ideas WHERE status = 'Live'")?.c || 0,
    highPriority: get("SELECT COUNT(*) as c FROM ideas WHERE priority = 'High'")?.c || 0,
  };
  res.json(stats);
});

// GET /api/ideas/tags
router.get("/tags", (_req, res) => {
  const rows = all("SELECT tags FROM ideas");
  const tagSet = new Set();
  for (const row of rows) {
    for (const tag of JSON.parse(row.tags)) {
      tagSet.add(tag);
    }
  }
  res.json([...tagSet].sort());
});

// GET /api/ideas/:id
router.get("/:id", (req, res) => {
  const idea = get("SELECT * FROM ideas WHERE id = $id", { $id: req.params.id });
  if (!idea) return res.status(404).json({ error: "Idea not found" });
  idea.tags = JSON.parse(idea.tags);
  res.json(idea);
});

// POST /api/ideas
router.post("/", (req, res) => {
  const { title, description, category, status, priority, tags, date, link, notes } = req.body;
  if (!title?.trim() || !description?.trim()) {
    return res.status(400).json({ error: "Title and description are required" });
  }

  const result = run(
    `INSERT INTO ideas (title, description, category, status, priority, tags, date, link, notes)
     VALUES ($title, $description, $category, $status, $priority, $tags, $date, $link, $notes)`,
    {
      $title: title.trim(),
      $description: description.trim(),
      $category: category || "Other",
      $status: status || "Idea",
      $priority: priority || "Medium",
      $tags: JSON.stringify(tags || []),
      $date: date || new Date().toISOString().slice(0, 10),
      $link: link || "",
      $notes: notes || "",
    }
  );

  const idea = get("SELECT * FROM ideas WHERE id = $id", { $id: result.lastInsertRowid });
  idea.tags = JSON.parse(idea.tags);
  res.status(201).json(idea);
});

// PUT /api/ideas/:id
router.put("/:id", (req, res) => {
  const existing = get("SELECT * FROM ideas WHERE id = $id", { $id: req.params.id });
  if (!existing) return res.status(404).json({ error: "Idea not found" });

  const { title, description, category, status, priority, tags, date, link, notes } = req.body;

  run(
    `UPDATE ideas SET
      title = $title, description = $description, category = $category,
      status = $status, priority = $priority, tags = $tags,
      date = $date, link = $link, notes = $notes,
      updated_at = datetime('now')
    WHERE id = $id`,
    {
      $id: req.params.id,
      $title: (title ?? existing.title).trim(),
      $description: (description ?? existing.description).trim(),
      $category: category ?? existing.category,
      $status: status ?? existing.status,
      $priority: priority ?? existing.priority,
      $tags: JSON.stringify(tags ?? JSON.parse(existing.tags)),
      $date: date ?? existing.date,
      $link: link ?? existing.link,
      $notes: notes ?? existing.notes,
    }
  );

  const idea = get("SELECT * FROM ideas WHERE id = $id", { $id: req.params.id });
  idea.tags = JSON.parse(idea.tags);
  res.json(idea);
});

// DELETE /api/ideas/:id
router.delete("/:id", (req, res) => {
  const result = run("DELETE FROM ideas WHERE id = $id", { $id: req.params.id });
  if (result.changes === 0) return res.status(404).json({ error: "Idea not found" });
  res.json({ success: true });
});

export default router;
