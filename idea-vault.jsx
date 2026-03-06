import { useState, useMemo, useCallback } from "react";

const CATEGORIES = ["Security", "AI/ML", "Mobile", "Tool", "PoC", "API", "Infrastructure", "Other"];
const STATUSES = ["Idea", "In Progress", "Completed", "Live"];
const STATUS_ICONS = { "Idea": "💡", "In Progress": "🔨", "Completed": "✅", "Live": "🚀" };
const STATUS_COLORS = {
  "Idea": "#f59e0b",
  "In Progress": "#3b82f6",
  "Completed": "#10b981",
  "Live": "#8b5cf6",
};
const PRIORITIES = ["High", "Medium", "Low"];
const PRIORITY_COLORS = { "High": "#ef4444", "Medium": "#f59e0b", "Low": "#6b7280" };
const PRIORITY_ICONS = { "High": "🔴", "Medium": "🟡", "Low": "⚪" };
const SORT_OPTIONS = [
  { value: "date-desc", label: "Newest First" },
  { value: "date-asc", label: "Oldest First" },
  { value: "priority", label: "Priority" },
  { value: "title", label: "Title A-Z" },
];
const INITIAL_IDEAS = [
  {
    id: 1,
    title: "Privacy Gateway",
    description: "A sidecar service that anonymizes NAD and Static Scanner data before sending it to the Invicti infrastructure. Built with Go + React/TS UI, following a 19-week development roadmap covering proxy layer, rule engine, and admin dashboard.",
    category: "Security",
    status: "In Progress",
    priority: "High",
    tags: ["Go", "Kubernetes", "NAD", "Privacy"],
    date: "2026-02-10",
    link: "",
    notes: "Phase 1 proxy layer complete. Working on rule engine with regex & JSONPath matchers.",
  },
  {
    id: 2,
    title: "Universal Polyglot API Scanner",
    description: "A CLI tool that performs Shadow API detection across Python, .NET, Go, Java, and JS codebases. Outputs OpenAPI 3.0 specs for seamless DAST integration. Supports framework-aware route extraction and dead endpoint detection.",
    category: "Tool",
    status: "Completed",
    priority: "Medium",
    tags: ["Python", "DAST", "OpenAPI", "Shadow API"],
    date: "2026-01-20",
    link: "",
    notes: "Successfully tested against 12 internal repos. Detected 47 undocumented endpoints.",
  },
  {
    id: 3,
    title: "Jira MCP Server",
    description: "A TypeScript MCP Server that connects Claude to Jira. Provides 9 tools including scan comparison, regression detection, and DAST quality gate automation. Enables AI-driven vulnerability triage workflows.",
    category: "AI/ML",
    status: "Completed",
    priority: "Medium",
    tags: ["TypeScript", "MCP", "Claude", "Jira"],
    date: "2026-01-05",
    link: "",
    notes: "Deployed to internal team. Reduced triage time by ~40%.",
  },
  {
    id: 4,
    title: "API Contract Drift Detector",
    description: "Monitors deployed APIs against their OpenAPI specs in CI/CD pipelines. Detects schema drift, missing endpoints, and undocumented response codes. Integrates with GitHub Actions and GitLab CI.",
    category: "API",
    status: "Idea",
    priority: "High",
    tags: ["OpenAPI", "CI/CD", "GitHub Actions", "Schema Validation"],
    date: "2026-03-01",
    link: "",
    notes: "",
  },
  {
    id: 5,
    title: "Vulnerability Knowledge Graph",
    description: "Graph database (Neo4j) mapping relationships between vulnerabilities, affected components, exploit chains, and remediation steps. Powers an AI assistant that suggests fix priorities based on attack path analysis.",
    category: "AI/ML",
    status: "Idea",
    priority: "Low",
    tags: ["Neo4j", "Graph DB", "NLP", "Vulnerability Management"],
    date: "2026-02-28",
    link: "",
    notes: "Research phase. Evaluating Neo4j vs Amazon Neptune.",
  },
];

let nextId = 6;

function IdeaCard({ idea, onEdit, onDelete, compact }) {
  const statusColor = STATUS_COLORS[idea.status] || "#666";

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      padding: compact ? "14px 16px" : "20px 22px",
      display: "flex",
      flexDirection: "column",
      gap: compact ? 8 : 12,
      transition: "all 0.2s",
      cursor: "default",
      position: "relative",
      overflow: "hidden",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.background = "rgba(255,255,255,0.07)";
      e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
      e.currentTarget.style.transform = "translateY(-2px)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
      e.currentTarget.style.transform = "translateY(0)";
    }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: statusColor, borderRadius: "16px 16px 0 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: statusColor, textTransform: "uppercase" }}>{idea.category}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>&middot;</span>
            <span style={{ fontSize: 11, color: PRIORITY_COLORS[idea.priority] || "#6b7280", fontWeight: 600 }}>{PRIORITY_ICONS[idea.priority]} {idea.priority}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>&middot;</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{idea.date}</span>
          </div>
          <h3 style={{ margin: 0, fontSize: compact ? 14 : 16, fontWeight: 700, color: "#f1f0eb", fontFamily: "'Playfair Display', serif", lineHeight: 1.3 }}>{idea.title}</h3>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={() => onEdit(idea)} style={iconBtn("#3b82f6")} title="Edit">✏️</button>
          <button onClick={() => onDelete(idea.id)} style={iconBtn("#ef4444")} title="Delete">🗑</button>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{idea.description}</p>
      {idea.notes && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8, borderLeft: `2px solid ${statusColor}44`, lineHeight: 1.5 }}>
          📝 {idea.notes}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44`, fontWeight: 600 }}>
          {STATUS_ICONS[idea.status]} {idea.status}
        </span>
        {idea.tags.map(t => (
          <span key={t} style={{ fontSize: 11, padding: "2px 9px", borderRadius: 20, background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>#{t}</span>
        ))}
      </div>
      {idea.link && (
        <a href={idea.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#6ee7b7", textDecoration: "none" }}>🔗 {idea.link}</a>
      )}
    </div>
  );
}

function iconBtn(color) {
  return {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    padding: "4px 6px",
    borderRadius: 8,
    transition: "background 0.15s",
    color: "white",
  };
}

function Modal({ idea, onClose, onSave }) {
  const [form, setForm] = useState(idea || {
    title: "", description: "", category: "Other", status: "Idea", priority: "Medium", tags: [], link: "", date: new Date().toISOString().slice(0, 10), notes: "",
  });
  const [tagInput, setTagInput] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "");
    if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]);
    setTagInput("");
  };

  const isValid = form.title.trim() && form.description.trim();

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: 32, width: "100%", maxWidth: 580, maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
        <h2 style={{ margin: 0, color: "#f1f0eb", fontFamily: "'Playfair Display', serif", fontSize: 22 }}>{idea ? "Edit Idea" : "New Idea"}</h2>
        {[["Title", "title", "text"], ["Description", "description", "textarea"], ["Notes (optional)", "notes", "textarea"], ["Link (optional)", "link", "text"]].map(([label, key, type]) => (
          <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: 0.5 }}>{label.toUpperCase()}</label>
            {type === "textarea"
              ? <textarea value={form[key]} onChange={e => set(key, e.target.value)} rows={key === "notes" ? 2 : 3} style={inputStyle} placeholder={key === "notes" ? "Progress updates, research links, blockers..." : ""} />
              : <input type="text" value={form[key]} onChange={e => set(key, e.target.value)} style={inputStyle} />}
          </div>
        ))}
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: 0.5 }}>CATEGORY</label>
            <select value={form.category} onChange={e => set("category", e.target.value)} style={inputStyle}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: 0.5 }}>STATUS</label>
            <select value={form.status} onChange={e => set("status", e.target.value)} style={inputStyle}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: 0.5 }}>PRIORITY</label>
            <select value={form.priority} onChange={e => set("priority", e.target.value)} style={inputStyle}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: 0.5 }}>TAGS</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Add a tag..." style={{ ...inputStyle, flex: 1 }} />
            <button onClick={addTag} style={{ ...actionBtn("#3b82f6"), padding: "0 16px" }}>+</button>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
            {form.tags.map(t => (
              <span key={t} onClick={() => set("tags", form.tags.filter(x => x !== t))} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", cursor: "pointer", border: "1px solid rgba(255,255,255,0.15)" }}>#{t} &times;</span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
          <button onClick={onClose} style={actionBtn("rgba(255,255,255,0.1)")}>Cancel</button>
          <button onClick={() => isValid && onSave({ ...form, id: idea?.id || nextId++ })} style={{ ...actionBtn(isValid ? "#6ee7b7" : "#444", isValid ? "#111" : "#888"), cursor: isValid ? "pointer" : "not-allowed" }}>Save</button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  padding: "10px 14px",
  color: "#f1f0eb",
  fontSize: 14,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
  resize: "vertical",
};

function actionBtn(bg, color = "#fff") {
  return { background: bg, color, border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.15s" };
}

function ProgressBar({ ideas }) {
  const total = ideas.length;
  if (total === 0) return null;
  const segments = STATUSES.map(s => ({
    status: s,
    count: ideas.filter(i => i.status === s).length,
    color: STATUS_COLORS[s],
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
        {segments.filter(s => s.count > 0).map(s => (
          <div key={s.status} style={{ width: `${(s.count / total) * 100}%`, background: s.color, transition: "width 0.3s" }} title={`${s.status}: ${s.count}`} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
        {segments.filter(s => s.count > 0).map(s => (
          <span key={s.status} style={{ fontSize: 10, color: s.color, fontWeight: 600 }}>{STATUS_ICONS[s.status]} {s.count} {s.status}</span>
        ))}
      </div>
    </div>
  );
}

function KanbanBoard({ ideas, onEdit, onDelete }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${STATUSES.length}, 1fr)`, gap: 16, padding: "0 32px 40px", minHeight: 300 }}>
      {STATUSES.map(status => {
        const items = ideas.filter(i => i.status === status);
        const color = STATUS_COLORS[status];
        return (
          <div key={status} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: `${color}11`, border: `1px solid ${color}33`, borderRadius: 12 }}>
              <span style={{ fontSize: 16 }}>{STATUS_ICONS[status]}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color }}>{status}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginLeft: "auto", background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>{items.length}</span>
            </div>
            {items.map(idea => (
              <IdeaCard key={idea.id} idea={idea} onEdit={onEdit} onDelete={onDelete} compact />
            ))}
            {items.length === 0 && (
              <div style={{ padding: "30px 16px", textAlign: "center", color: "rgba(255,255,255,0.15)", fontSize: 12, border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 12 }}>
                No ideas yet
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const [ideas, setIdeas] = useState(INITIAL_IDEAS);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [sortBy, setSortBy] = useState("date-desc");
  const [modal, setModal] = useState(null);
  const [filterTag, setFilterTag] = useState("");
  const [view, setView] = useState("grid");

  const allTags = useMemo(() => [...new Set(ideas.flatMap(i => i.tags))].sort(), [ideas]);

  const filtered = useMemo(() => {
    const list = ideas.filter(i => {
      const q = search.toLowerCase();
      const matchSearch = !q || i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.tags.some(t => t.toLowerCase().includes(q));
      const matchCat = filterCat === "All" || i.category === filterCat;
      const matchStatus = filterStatus === "All" || i.status === filterStatus;
      const matchPriority = filterPriority === "All" || i.priority === filterPriority;
      const matchTag = !filterTag || i.tags.includes(filterTag);
      return matchSearch && matchCat && matchStatus && matchPriority && matchTag;
    });

    const priorityOrder = { "High": 0, "Medium": 1, "Low": 2 };
    switch (sortBy) {
      case "date-desc": list.sort((a, b) => b.date.localeCompare(a.date)); break;
      case "date-asc": list.sort((a, b) => a.date.localeCompare(b.date)); break;
      case "priority": list.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]); break;
      case "title": list.sort((a, b) => a.title.localeCompare(b.title)); break;
    }
    return list;
  }, [ideas, search, filterCat, filterStatus, filterPriority, filterTag, sortBy]);

  const stats = useMemo(() => ({
    total: ideas.length,
    ideas: ideas.filter(i => i.status === "Idea").length,
    active: ideas.filter(i => i.status === "In Progress").length,
    done: ideas.filter(i => i.status === "Completed").length,
    live: ideas.filter(i => i.status === "Live").length,
    highPriority: ideas.filter(i => i.priority === "High").length,
  }), [ideas]);

  const handleSave = (idea) => {
    setIdeas(prev => prev.find(i => i.id === idea.id) ? prev.map(i => i.id === idea.id ? idea : i) : [...prev, idea]);
    setModal(null);
  };

  const handleDelete = (id) => setIdeas(prev => prev.filter(i => i.id !== id));

  const handleExport = useCallback(() => {
    const data = JSON.stringify(ideas, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `idea-vault-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [ideas]);

  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          if (Array.isArray(imported)) {
            setIdeas(imported);
            nextId = Math.max(...imported.map(i => i.id), 0) + 1;
          }
        } catch { /* ignore invalid files */ }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  const clearFilters = () => {
    setSearch("");
    setFilterCat("All");
    setFilterStatus("All");
    setFilterPriority("All");
    setFilterTag("");
    setSortBy("date-desc");
  };

  const hasActiveFilters = search || filterCat !== "All" || filterStatus !== "All" || filterPriority !== "All" || filterTag;

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d1a", fontFamily: "'DM Sans', sans-serif", color: "#f1f0eb" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "28px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontFamily: "'Playfair Display', serif", background: "linear-gradient(135deg, #6ee7b7, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Idea Vault
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>Your central hub for AI-powered project ideas</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={handleImport} style={{ ...actionBtn("rgba(255,255,255,0.08)"), padding: "10px 16px", borderRadius: 12, fontSize: 12 }} title="Import JSON">
            📥 Import
          </button>
          <button onClick={handleExport} style={{ ...actionBtn("rgba(255,255,255,0.08)"), padding: "10px 16px", borderRadius: 12, fontSize: 12 }} title="Export JSON">
            📤 Export
          </button>
          <button onClick={() => setModal("new")} style={{ ...actionBtn("linear-gradient(135deg, #6ee7b7, #3b82f6)", "#0d0d1a"), display: "flex", alignItems: "center", gap: 6, fontWeight: 700, padding: "12px 22px", borderRadius: 12 }}>
            + New Idea
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, padding: "20px 32px", flexWrap: "wrap" }}>
        {[
          { label: "Total", value: stats.total, color: "#f1f0eb" },
          { label: "Ideas", value: stats.ideas, color: "#f59e0b" },
          { label: "In Progress", value: stats.active, color: "#3b82f6" },
          { label: "Completed", value: stats.done, color: "#10b981" },
          { label: "Live", value: stats.live, color: "#8b5cf6" },
          { label: "High Priority", value: stats.highPriority, color: "#ef4444" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 22px", display: "flex", flexDirection: "column", gap: 2, minWidth: 90 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "'Playfair Display', serif" }}>{s.value}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: 0.5 }}>{s.label.toUpperCase()}</span>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div style={{ padding: "0 32px 16px" }}>
        <ProgressBar ideas={ideas} />
      </div>

      {/* Filters */}
      <div style={{ padding: "0 32px 12px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search ideas..."
          style={{ ...inputStyle, width: 220, padding: "10px 16px" }}
        />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
          <option value="All">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
          <option value="All">All Priorities</option>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {/* View Toggle */}
        <div style={{ display: "flex", marginLeft: "auto", gap: 4, background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 3 }}>
          <button onClick={() => setView("grid")} style={{ background: view === "grid" ? "rgba(255,255,255,0.12)" : "transparent", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: view === "grid" ? "#f1f0eb" : "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: 600, transition: "all 0.15s" }}>
            ▦ Grid
          </button>
          <button onClick={() => setView("kanban")} style={{ background: view === "kanban" ? "rgba(255,255,255,0.12)" : "transparent", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: view === "kanban" ? "#f1f0eb" : "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: 600, transition: "all 0.15s" }}>
            ☰ Kanban
          </button>
        </div>
      </div>

      {/* Active Filters & Tags */}
      <div style={{ padding: "0 32px 16px", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {hasActiveFilters && (
          <span onClick={clearFilters} style={{ fontSize: 11, padding: "4px 12px", borderRadius: 20, background: "#ef444422", color: "#ef4444", border: "1px solid #ef444444", cursor: "pointer", fontWeight: 600 }}>
            Clear Filters &times;
          </span>
        )}
        {filterTag && (
          <span onClick={() => setFilterTag("")} style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, background: "#6ee7b722", color: "#6ee7b7", border: "1px solid #6ee7b744", cursor: "pointer" }}>
            #{filterTag} &times;
          </span>
        )}
        {allTags.map(t => (
          t !== filterTag && (
            <span key={t} onClick={() => setFilterTag(filterTag === t ? "" : t)} style={{
              fontSize: 11, padding: "3px 10px", borderRadius: 20, cursor: "pointer", transition: "all 0.15s",
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>#{t}</span>
          )
        ))}
      </div>

      {/* Content */}
      {view === "kanban" ? (
        <KanbanBoard ideas={filtered} onEdit={i => setModal(i)} onDelete={handleDelete} />
      ) : (
        <div style={{ padding: "0 32px 40px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {filtered.length === 0 ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.25)" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 14 }}>No ideas found</div>
              {hasActiveFilters && <div style={{ fontSize: 12, marginTop: 8, color: "rgba(255,255,255,0.2)" }}>Try adjusting your filters</div>}
            </div>
          ) : filtered.map(idea => (
            <IdeaCard key={idea.id} idea={idea} onEdit={i => setModal(i)} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px 32px", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 12 }}>
        Showing {filtered.length} of {ideas.length} ideas &middot; Idea Vault v2.0
      </div>

      {/* Modal */}
      {modal !== null && (
        <Modal idea={modal === "new" ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </div>
  );
}
