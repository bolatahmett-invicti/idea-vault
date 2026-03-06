import { useState, useMemo, useCallback, useEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const CATEGORIES = ["Security", "AI/ML", "Mobile", "Tool", "PoC", "API", "Infrastructure", "Other"];
const STATUSES = ["Idea", "In Progress", "Completed", "Live"];
const STATUS_ICONS = { "Idea": "\u{1f4a1}", "In Progress": "\u{1f528}", "Completed": "\u2705", "Live": "\u{1f680}" };
const STATUS_COLORS = {
  "Idea": "#f59e0b",
  "In Progress": "#3b82f6",
  "Completed": "#10b981",
  "Live": "#8b5cf6",
};
const PRIORITIES = ["High", "Medium", "Low"];
const PRIORITY_COLORS = { "High": "#ef4444", "Medium": "#f59e0b", "Low": "#6b7280" };
const PRIORITY_ICONS = { "High": "\u{1f534}", "Medium": "\u{1f7e1}", "Low": "\u26aa" };
const SORT_OPTIONS = [
  { value: "date-desc", label: "Newest First" },
  { value: "date-asc", label: "Oldest First" },
  { value: "priority", label: "Priority" },
  { value: "title", label: "Title A-Z" },
];

// --- API helpers ---
async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// --- Components ---

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
          <button onClick={() => onEdit(idea)} style={iconBtn()} title="Edit">{"\u270f\ufe0f"}</button>
          <button onClick={() => onDelete(idea.id)} style={iconBtn()} title="Delete">{"\u{1f5d1}"}</button>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{idea.description}</p>
      {idea.notes && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8, borderLeft: `2px solid ${statusColor}44`, lineHeight: 1.5 }}>
          {"\u{1f4dd}"} {idea.notes}
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
        <a href={idea.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#6ee7b7", textDecoration: "none" }}>{"\u{1f517}"} {idea.link}</a>
      )}
    </div>
  );
}

function iconBtn() {
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

function Modal({ idea, onClose, onSave, saving }) {
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
          <button
            disabled={!isValid || saving}
            onClick={() => isValid && !saving && onSave({ ...form, id: idea?.id })}
            style={{ ...actionBtn(isValid && !saving ? "#6ee7b7" : "#444", isValid && !saving ? "#111" : "#888"), cursor: isValid && !saving ? "pointer" : "not-allowed" }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
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

// --- AI Chat Panel ---
function ChatPanel({ open, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open) {
      api("/chat/history").then(setMessages).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setError(null);
    setMessages(prev => [...prev, { role: "user", content: userMsg, id: Date.now() }]);
    setLoading(true);

    try {
      const res = await api("/chat", {
        method: "POST",
        body: JSON.stringify({ message: userMsg }),
      });
      setMessages(prev => [...prev, { role: "assistant", content: res.content, id: Date.now() + 1 }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await api("/chat/history", { method: "DELETE" });
      setMessages([]);
    } catch {}
  };

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", right: 0, top: 0, bottom: 0, width: 420, background: "#12121f",
      borderLeft: "1px solid rgba(255,255,255,0.08)", zIndex: 90, display: "flex", flexDirection: "column",
      boxShadow: "-8px 0 32px rgba(0,0,0,0.4)",
    }}>
      {/* Chat Header */}
      <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6ee7b7" }} />
        <span style={{ fontSize: 15, fontWeight: 700, color: "#f1f0eb", flex: 1, fontFamily: "'Playfair Display', serif" }}>AI Assistant</span>
        <button onClick={clearHistory} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 11, padding: "4px 8px" }} title="Clear chat history">
          Clear
        </button>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 18, padding: "0 4px" }}>
          &times;
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(255,255,255,0.2)" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{"\u{1f916}"}</div>
            <div style={{ fontSize: 14, marginBottom: 8 }}>IdeaVault AI Assistant</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.15)", lineHeight: 1.6 }}>
              Ask me about your ideas, brainstorm new ones, or check if something similar already exists in the vault.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 16 }}>
              {["What ideas do we have in progress?", "I have an idea for a security dashboard", "Which ideas overlap with each other?"].map(q => (
                <button key={q} onClick={() => { setInput(q); }} style={{
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
                  padding: "8px 14px", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", textAlign: "left",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={msg.id || i} style={{
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%",
            padding: "10px 14px",
            borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
            background: msg.role === "user" ? "#3b82f6" : "rgba(255,255,255,0.06)",
            color: msg.role === "user" ? "#fff" : "rgba(255,255,255,0.7)",
            fontSize: 13,
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}>
            {msg.content}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", padding: "10px 14px", borderRadius: "14px 14px 14px 4px", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
            <span style={{ animation: "pulse 1.5s infinite" }}>Thinking...</span>
          </div>
        )}
        {error && (
          <div style={{ padding: "8px 12px", borderRadius: 10, background: "#ef444422", color: "#ef4444", fontSize: 12, border: "1px solid #ef444444" }}>
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Ask about ideas..."
          style={{ ...inputStyle, flex: 1, borderRadius: 12, padding: "10px 14px" }}
          disabled={loading}
        />
        <button onClick={send} disabled={loading || !input.trim()} style={{
          ...actionBtn(loading || !input.trim() ? "#333" : "linear-gradient(135deg, #6ee7b7, #3b82f6)", loading || !input.trim() ? "#666" : "#0d0d1a"),
          padding: "10px 16px", borderRadius: 12, cursor: loading || !input.trim() ? "not-allowed" : "pointer",
        }}>
          Send
        </button>
      </div>
    </div>
  );
}

// --- Main App ---
export default function App() {
  const [ideas, setIdeas] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [sortBy, setSortBy] = useState("date-desc");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterTag, setFilterTag] = useState("");
  const [view, setView] = useState("grid");
  const [chatOpen, setChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch ideas from API
  const fetchIdeas = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterCat !== "All") params.set("category", filterCat);
      if (filterStatus !== "All") params.set("status", filterStatus);
      if (filterPriority !== "All") params.set("priority", filterPriority);
      if (filterTag) params.set("tag", filterTag);
      if (sortBy) params.set("sort", sortBy);

      const data = await api(`/ideas?${params}`);
      setIdeas(data);
    } catch (err) {
      console.error("Failed to fetch ideas:", err);
    } finally {
      setLoading(false);
    }
  }, [search, filterCat, filterStatus, filterPriority, filterTag, sortBy]);

  const fetchTags = useCallback(async () => {
    try {
      const tags = await api("/ideas/tags");
      setAllTags(tags);
    } catch {}
  }, []);

  useEffect(() => { fetchIdeas(); }, [fetchIdeas]);
  useEffect(() => { fetchTags(); }, [fetchTags]);

  const stats = useMemo(() => ({
    total: ideas.length,
    ideas: ideas.filter(i => i.status === "Idea").length,
    active: ideas.filter(i => i.status === "In Progress").length,
    done: ideas.filter(i => i.status === "Completed").length,
    live: ideas.filter(i => i.status === "Live").length,
    highPriority: ideas.filter(i => i.priority === "High").length,
  }), [ideas]);

  const handleSave = async (idea) => {
    setSaving(true);
    try {
      if (idea.id) {
        await api(`/ideas/${idea.id}`, { method: "PUT", body: JSON.stringify(idea) });
      } else {
        await api("/ideas", { method: "POST", body: JSON.stringify(idea) });
      }
      setModal(null);
      fetchIdeas();
      fetchTags();
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api(`/ideas/${id}`, { method: "DELETE" });
      fetchIdeas();
      fetchTags();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleExport = useCallback(async () => {
    try {
      const data = await api("/ideas");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `idea-vault-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  }, []);

  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const imported = JSON.parse(text);
        if (Array.isArray(imported)) {
          for (const idea of imported) {
            const { id, created_at, updated_at, ...rest } = idea;
            await api("/ideas", { method: "POST", body: JSON.stringify(rest) });
          }
          fetchIdeas();
          fetchTags();
        }
      } catch { /* ignore invalid files */ }
    };
    input.click();
  }, [fetchIdeas, fetchTags]);

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
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "28px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontFamily: "'Playfair Display', serif", background: "linear-gradient(135deg, #6ee7b7, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Idea Vault
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>Your central hub for AI-powered project ideas</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setChatOpen(!chatOpen)} style={{
            ...actionBtn(chatOpen ? "#6ee7b7" : "rgba(255,255,255,0.08)", chatOpen ? "#111" : "#fff"),
            padding: "10px 16px", borderRadius: 12, fontSize: 12, display: "flex", alignItems: "center", gap: 6,
          }}>
            {"\u{1f916}"} AI Chat
          </button>
          <button onClick={handleImport} style={{ ...actionBtn("rgba(255,255,255,0.08)"), padding: "10px 16px", borderRadius: 12, fontSize: 12 }} title="Import JSON">
            Import
          </button>
          <button onClick={handleExport} style={{ ...actionBtn("rgba(255,255,255,0.08)"), padding: "10px 16px", borderRadius: 12, fontSize: 12 }} title="Export JSON">
            Export
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
          placeholder="Search ideas..."
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
        <div style={{ display: "flex", marginLeft: "auto", gap: 4, background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 3 }}>
          <button onClick={() => setView("grid")} style={{ background: view === "grid" ? "rgba(255,255,255,0.12)" : "transparent", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: view === "grid" ? "#f1f0eb" : "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: 600, transition: "all 0.15s" }}>
            Grid
          </button>
          <button onClick={() => setView("kanban")} style={{ background: view === "kanban" ? "rgba(255,255,255,0.12)" : "transparent", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: view === "kanban" ? "#f1f0eb" : "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: 600, transition: "all 0.15s" }}>
            Kanban
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
      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 20px", color: "rgba(255,255,255,0.3)" }}>
          <div style={{ fontSize: 14 }}>Loading ideas...</div>
        </div>
      ) : view === "kanban" ? (
        <KanbanBoard ideas={ideas} onEdit={i => setModal(i)} onDelete={handleDelete} />
      ) : (
        <div style={{ padding: "0 32px 40px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {ideas.length === 0 ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.25)" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{"\u{1f50d}"}</div>
              <div style={{ fontSize: 14 }}>No ideas found</div>
              {hasActiveFilters && <div style={{ fontSize: 12, marginTop: 8, color: "rgba(255,255,255,0.2)" }}>Try adjusting your filters</div>}
            </div>
          ) : ideas.map(idea => (
            <IdeaCard key={idea.id} idea={idea} onEdit={i => setModal(i)} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px 32px", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 12 }}>
        Showing {ideas.length} ideas &middot; Idea Vault v3.0
      </div>

      {/* Modal */}
      {modal !== null && (
        <Modal idea={modal === "new" ? null : modal} onClose={() => setModal(null)} onSave={handleSave} saving={saving} />
      )}

      {/* Chat Panel */}
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
