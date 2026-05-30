"use client";

import { useState } from "react";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";

type ScriptItem = {
  id: string;
  name: string;
  category: string;
  interactive: boolean;
  icon: string;
  color: string;
  bg: string;
  restricted?: boolean;
};

type QueueItem = {
  name: string;
  status: string;
  time: string;
  icon: string;
  color: string;
  dot: string;
};

type LogItem = {
  time: string;
  ok: boolean | null;
  text: string;
};

type Workspace = {
  id: any;
  key: string;
  label: string;
  status: "running" | "waiting_input" | "queued" | "failed" | "completed";
  subtitle: string;
  accent?: "purple";
  logs?: LogItem[];
  input?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
};

type ViewMode = "grid" | "list";


//CONSTANTS AND MOCK DATA

const FAVORITES_DEFAULT = ["assemble-pdf", "checkin-bpl", "retrieve-blocks", "revision-info", "shell-tool"];
const SCRIPTS: ScriptItem[] = [
  { id: "assemble-pdf", name: "Assemble PDF", category: "Assembly", interactive: true, icon: "📚", color: "#ef4444", bg: "#fef2f2" },
  { id: "assemble-condensed", name: "Assemble Condensed", category: "Assembly", interactive: true, icon: "📋", color: "#f97316", bg: "#fff7ed" },
  { id: "checkin-bpl", name: "Check In BPL", category: "Version Control", interactive: true, icon: "⬆️", color: "#22c55e", bg: "#f0fdf4" },
  { id: "checkout-bpl", name: "Check Out BPL", category: "Version Control", interactive: true, icon: "⬇️", color: "#3b82f6", bg: "#eff6ff" },
  { id: "retrieve-blocks", name: "Retrieve Blocks", category: "Editing", interactive: true, icon: "📥", color: "#3b82f6", bg: "#eff6ff" },
  { id: "revision-info", name: "Revision Info", category: "Version Control", interactive: false, icon: "📄", color: "#f59e0b", bg: "#fffbeb" },
  { id: "remove-revision", name: "Remove Revision", category: "Version Control", interactive: false, icon: "🗑️", color: "#ef4444", bg: "#fef2f2" },
  { id: "shell-tool", name: "Shell Tool", category: "Utilities", interactive: true, icon: "⚙️", color: "#6b7280", bg: "#f9fafb", restricted: true },
  { id: "list-files", name: "List Files", category: "Utilities", interactive: false, icon: "📑", color: "#8b5cf6", bg: "#f5f3ff" },
  { id: "utilities", name: "Utilities", category: "Utilities", interactive: true, icon: "🔧", color: "#14b8a6", bg: "#f0fdfa" },
  { id: "checkout-revision-edit", name: "Check Out Revision (Edit)", category: "Version Control", interactive: true, icon: "✏️", color: "#6366f1", bg: "#eef2ff" },
  { id: "checkout-revision-view", name: "Check Out Revision (View)", category: "Version Control", interactive: false, icon: "👁️", color: "#0ea5e9", bg: "#f0f9ff" },
  { id: "checkin-docid", name: "Check In Docid", category: "Version Control", interactive: true, icon: "✅", color: "#22c55e", bg: "#f0fdf4" },
  { id: "checkout-docid", name: "Check Out Docid", category: "Version Control", interactive: true, icon: "📂", color: "#3b82f6", bg: "#eff6ff" },
  { id: "crisp", name: "Crisp Editor", category: "Editing", interactive: true, icon: "✍️", color: "#a855f7", bg: "#faf5ff" },
  { id: "insert-customs", name: "Insert Customs", category: "Editing", interactive: true, icon: "🔧", color: "#f97316", bg: "#fff7ed" },
  { id: "insert-standard-blocks", name: "Insert Standard Blocks", category: "Editing", interactive: true, icon: "🧱", color: "#84cc16", bg: "#f7fee7" },
  { id: "move-id", name: "Move Id", category: "Utilities", interactive: true, icon: "🔀", color: "#ec4899", bg: "#fdf2f8" },
  { id: "copy-key", name: "Password-less Auth", category: "Utilities", interactive: true, icon: "🔑", color: "#f59e0b", bg: "#fffbeb" },
  { id: "view-error-log", name: "View Assembly Error File", category: "Logs", interactive: false, icon: "⚠️", color: "#ef4444", bg: "#fef2f2" },
  { id: "view-custom-log", name: "View Custom Insert Log", category: "Logs", interactive: false, icon: "📄", color: "#6b7280", bg: "#f9fafb" },
];

const JOBS_MOCK = [
  { id: 1, key: "assemble-pdf", label: "Assemble PDF", status: "running", time: "10:21:34 AM" },
  { id: 2, key: "retrieve-blocks", label: "Retrieve Blocks", status: "running", time: "10:22:11 AM" },
  { id: 3, key: "shell-tool", label: "Shell Tool", status: "running", time: "10:23:02 AM" },
  { id: 4, key: "checkout-bpl", label: "Check Out BPL", status: "running", time: "10:23:18 AM" },
  { id: 5, key: "checkin-bpl", label: "Check In BPL", status: "waiting_input", time: "10:23:44 AM" },
  { id: 6, key: "list-files", label: "List File Revision Info", status: "queued", time: "10:24:01 AM" },
];

const ATTENTION_MOCK = [
  { id: 1, key: "checkin-bpl", label: "Check In BPL", reason: "Waiting for filename", status: "waiting", time: "10:23:44 AM" },
  { id: 2, key: "remove-revision", label: "Remove Revision", reason: "Failed", status: "failed", time: "10:22:31 AM" },
  { id: 3, key: "revision-info", label: "Revision Info", reason: "Permission denied", status: "failed", time: "10:20:11 AM" },
];

const queue: QueueItem[] = [
  { name: "Assemble PDF", status: "Running", time: "10:21:34 AM", icon: "pi-book", color: "pink", dot: "green" },
  { name: "Retrieve Blocks", status: "Running", time: "10:22:11 AM", icon: "pi-file", color: "indigo", dot: "green" },
  { name: "Shell Tool", status: "Running", time: "10:23:02 AM", icon: "pi-terminal", color: "slate", dot: "green" },
  { name: "Check Out BPL", status: "Running", time: "10:23:18 AM", icon: "pi-download", color: "blue", dot: "green" },
  { name: "Check In BPL", status: "Waiting Input", time: "10:23:44 AM", icon: "pi-upload", color: "green", dot: "purple" },
  { name: "List File Revision Info", status: "Queued", time: "10:24:01 AM", icon: "pi-clipboard", color: "cyan", dot: "orange" }
];

const WORKSPACE_MOCK: Workspace[] = [
  {
    id: 1, key: "assemble-pdf", label: "Assemble PDF", status: "running",
    subtitle: "Generating booklet content...",
    logs: [
      { time: "10:21:34", ok: true, text: "Connected to Linux Server 01" },
      { time: "10:21:42", ok: true, text: "BPL source loaded successfully" },
      { time: "10:21:51", ok: true, text: "Variables generated (165 items)" },
      { time: "10:22:03", ok: null, text: "Assembling content..." },
    ],
  },
  {
    id: 2, key: "retrieve-blocks", label: "Retrieve Blocks", status: "running",
    subtitle: "Retrieving textblocks...",
    logs: [
      { time: "10:22:11", ok: true, text: "Connected to Linux Server 01" },
      { time: "10:22:18", ok: true, text: "Reading revision list" },
      { time: "10:22:28", ok: true, text: "Retrieving textblocks..." },
      { time: "10:22:33", ok: null, text: "Processing data..." },
    ],
  },
  {
    id: 3, key: "checkin-bpl", label: "Check In BPL", status: "waiting_input",
    subtitle: "Please provide filename to continue",
    inputLabel: "Filename",
    inputPlaceholder: "Enter filename (e.g., DOC-2026-0001)",
    logs: [],
  },
  {
    id: 4, key: "shell-tool", label: "Shell Tool", status: "running",
    subtitle: "Executing commands...",
    logs: [
      { time: "10:23:02", ok: true, text: "Connected to Linux Server 01" },
      { time: "10:23:05", ok: true, text: "Command prepared" },
      { time: "10:23:06", ok: null, text: "Executing..." },
    ],
  },
];


const ScriptItemRow = ({ item, isFavorite, onToggleFavorite, hoveredFav, setHoveredFav, handleLaunch, t }: { item: ScriptItem; isFavorite: boolean; onToggleFavorite: () => void; hoveredFav?: string | null; setHoveredFav?: any; handleLaunch: any; t: any }) => {
  const hov = hoveredFav === item.id;
  return (
    <div className="script-line" key={item.name}
      onMouseEnter={() => setHoveredFav(item.id)}
      onMouseLeave={() => setHoveredFav(null)}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "6px 6px", borderRadius: 6, cursor: "pointer",
        background: hoveredFav === item.id ? item.bg : "transparent",
        transition: "background 0.1s",
      }}
    >
      <div className="script-main">
        <ScriptIcon script={item} size={22} isDark={t.dark} />
        <span className="script-name">{item.name}</span>
      </div>
      <FavoriteIcon isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} t={t} />
      <button
        onClick={() => handleLaunch(item.id)}
        style={{
          padding: "3px 12px", borderRadius: 6, flexShrink: 0,
          border: `1px solid ${hov ? item.color : t.border2}`,
          background: hov ? item.bg : "transparent",
          color: hov ? item.color : t.text2,
          fontSize: 12, fontWeight: 500, cursor: "pointer",
          transition: "all 0.15s",
          minWidth: 60, textAlign: "center",
        }}
      >
        {"▶ Run"}
      </button>
    </div>
  )
};

const FavoriteIcon = ({ isFavorite, onToggleFavorite, t }: { isFavorite: boolean; onToggleFavorite: () => void; t: any }) => (
  <button onClick={e => { e.stopPropagation(); onToggleFavorite(); }} style={{
    background: "none", border: "none", cursor: "pointer",
    fontSize: 14, padding: "0 2px", lineHeight: 1,
    color: isFavorite ? "#f59e0b" : t.text3,
  }}>
    {isFavorite ? "★" : "☆"}
  </button>
);

function ScriptIcon({ script, size = 32, isDark }: { script: ScriptItem; size?: number; isDark: boolean }) {
  const bg = isDark
    ? script.color + "22"
    : script.bg || "#f1f5f9";
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: bg,
      border: `1.5px solid ${script.color}44`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.44, flexShrink: 0,
    }}>
      {script.icon}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const map = {
    running: { color: "#22c55e", label: "Running", pulse: true },
    waiting_input: { color: "#a855f7", label: "Waiting Input", pulse: true },
    queued: { color: "#f59e0b", label: "Queued", pulse: false },
    failed: { color: "#ef4444", label: "Failed", pulse: false },
    completed: { color: "#3b82f6", label: "Completed", pulse: false },
  };
  const s = map[status as keyof typeof map] || { color: "#94a3b8", label: status };
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: s.color, flexShrink: 0,
        boxShadow: s.pulse ? `0 0 0 2px ${s.color}44` : "none",
        animation: s.pulse ? "dotPulse 1.8s ease-in-out infinite" : "none",
      }} />
    </span>
  );
}

function StatusPill({ status, t }: { status: string; t: any }) {
  const map = {
    running: { color: "#22c55e", bg: "#f0fdf4", darkBg: "#14532d44", border: "#bbf7d0", label: "RUNNING" },
    waiting_input: { color: "#a855f7", bg: "#faf5ff", darkBg: "#4c1d9544", border: "#e9d5ff", label: "WAITING INPUT" },
    queued: { color: "#f59e0b", bg: "#fffbeb", darkBg: "#78350f44", border: "#fde68a", label: "QUEUED" },
    failed: { color: "#ef4444", bg: "#fef2f2", darkBg: "#7f1d1d44", border: "#fecaca", label: "FAILED" },
    completed: { color: "#3b82f6", bg: "#eff6ff", darkBg: "#1e3a8a44", border: "#bfdbfe", label: "COMPLETED" },
  };
  const s = map[status as keyof typeof map] || { color: "#94a3b8", bg: "#f9fafb", label: status.toUpperCase() };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px",
      borderRadius: 20, letterSpacing: "0.06em",
      color: s.color,
      background: t.dark ? s.darkBg : s.bg,
      border: `1px solid ${s.border || s.color + "33"}`,
    }}>
      {s.label}
    </span>
  );
}

function StatusMetric({
  icon,
  label,
  value,
  tone
}: {
  icon: string;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="status-metric">
      <span className={`metric-icon ${tone}`}><i className={`pi ${icon}`} /></span>
      <span>
        <span className="metric-label">{label}</span>
        <strong className={tone}>{value}</strong>
      </span>
    </div>
  );
}

function WorkspaceCard({ ws, t, onInput }: { ws: Workspace; t?: any; onInput?: (id: string, input: string) => void }) {
  const script = SCRIPTS.find(s => s.id === ws.key) || null;
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    if (!input.trim()) return;
    setSubmitted(true);
    onInput?.(ws.id, input);
  };

  if (!script) return null;

  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${ws.status === "waiting_input" ? "#a855f766" : t.border}`,
      borderRadius: 10,
      overflow: "hidden",
      boxShadow: ws.status === "waiting_input"
        ? `0 0 0 2px #a855f722, ${t.shadow}`
        : t.shadow,
      display: "flex", flexDirection: "column",
    }}>
      {/* Card header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 14px 10px",
        borderBottom: `1px solid ${t.border}`,
      }}>
        <ScriptIcon script={script} size={34} isDark={t.dark} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: t.text, letterSpacing: "-0.2px" }}>
            {ws.label}
          </div>
          <div style={{
            fontSize: 12,
            color: ws.status === "waiting_input" ? "#a855f7"
              : ws.status === "failed" ? "#ef4444"
                : t.text2,
            marginTop: 1,
          }}>
            {ws.subtitle}
          </div>
        </div>
        <StatusPill status={ws.status} t={t} />
        <button style={{ background: "none", border: "none", cursor: "pointer", color: t.text3, fontSize: 16, padding: "2px 4px" }}>✕</button>
      </div>

      {/* Log lines */}
      {ws?.logs && ws?.logs?.length > 0 && (
        <div style={{ padding: "10px 14px 6px", background: t.dark ? "#0d1424" : "#fafbff" }}>
          {ws?.logs?.map((l, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              padding: "2px 0",
              fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5,
              color: t.text2,
            }}>
              <span style={{ color: t.text3, flexShrink: 0, width: 52 }}>{l.time}</span>
              <span style={{
                width: 14, height: 14, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                background: l.ok === true ? "#22c55e22" : l.ok === false ? "#ef444422" : "#f59e0b22",
                border: `1px solid ${l.ok === true ? "#22c55e" : l.ok === false ? "#ef4444" : "#f59e0b"}55`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 8, color: l.ok === true ? "#22c55e" : l.ok === false ? "#ef4444" : "#f59e0b",
              }}>
                {l.ok === true ? "✓" : l.ok === false ? "✕" : "→"}
              </span>
              <span style={{ color: l.ok === null ? t.text2 : t.text }}>{l.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Input form for waiting_input */}
      {ws.status === "waiting_input" && !submitted && (
        <div style={{ padding: "10px 14px 12px", background: t.dark ? "#130e1e" : "#fdf5ff" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: t.text3, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
            {ws.inputLabel}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder={ws.inputPlaceholder}
              style={{
                flex: 1, padding: "8px 12px",
                background: t.surface,
                border: `1.5px solid #a855f766`,
                borderRadius: 7, fontSize: 13, color: t.text,
                outline: "none", fontFamily: "inherit",
              }}
            />
            <button onClick={submit} style={{
              padding: "8px 18px", borderRadius: 7, border: "none",
              background: "#7c3aed", color: "#fff",
              fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>Submit</button>
          </div>
        </div>
      )}

      {submitted && (
        <div style={{ padding: "10px 14px", background: "#14532d22", fontSize: 12, color: "#22c55e" }}>
          ✓ Input submitted. Processing...
        </div>
      )}

      {/* Footer actions */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14, padding: "8px 14px",
        borderTop: `1px solid ${t.border}`,
      }}>
        {ws.status !== "waiting_input" && (
          <button style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "none", border: "none", cursor: "pointer",
            color: "#ef4444", fontSize: 13, fontWeight: 500, padding: 0,
          }}>
            <span style={{
              width: 14, height: 14, borderRadius: 2,
              border: "2px solid #ef4444",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 8,
            }}>■</span>
            Stop
          </button>
        )}
      
      <div style={{ flex: 1 }} />
        <button style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "none", border: "none", cursor: "pointer",
            color: t.text2, fontSize: 13, fontWeight: 500, padding: 0,
          }}>
            <span className="pi pi-window-maximize"></span>
            View
          </button>
      </div>
    </div>
  );
}

function useTheme(mode: "light" | "dark") {
  const dark = mode === "dark";
  return {
    dark,
    bg: dark ? "#0f1623" : "#f0f4f8",
    surface: dark ? "#161e2e" : "#ffffff",
    surface2: dark ? "#1c2640" : "#f8fafc",
    surface3: dark ? "#1e2d47" : "#f1f5f9",
    border: dark ? "#243049" : "#e2e8f0",
    border2: dark ? "#2d3f60" : "#cbd5e1",
    text: dark ? "#e2eaf6" : "#0f172a",
    text2: dark ? "#8fa3c0" : "#475569",
    text3: dark ? "#4a6080" : "#94a3b8",
    accent: "#1d4ed8",
    accentBg: dark ? "#1e3a8a22" : "#eff6ff",
    shadow: dark ? "0 2px 16px #00000055" : "0 2px 16px #0000000f",
    shadow2: dark ? "0 8px 40px #00000088" : "0 8px 40px #0000001a",
  };
}

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const isDark = theme === "dark";
  const t = useTheme(theme);

  const [favorites, setFavorites] = useState(new Set(FAVORITES_DEFAULT));
  const [showLaunch, setShowLaunch] = useState(false);
  const [search, setSearch] = useState("");
  const [gridCols, setGridCols] = useState(2); // 1 or 2
  const [hoveredFav, setHoveredFav] = useState<string | null>(null);
  const [launchedKey, setLaunchedKey] = useState<string | null>(null);

  const toggleFav = (key: string) => {
    setFavorites(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };

  const favScripts = SCRIPTS.filter(s => favorites.has(s.id));
  const filteredScripts = SCRIPTS.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  const handleLaunch = (key: any) => {
    setLaunchedKey(key);
    setTimeout(() => setLaunchedKey(null), 1200);
  };

  return (
    <main className="app-shell" data-theme={theme}>
      <aside className="sidebar">
        <section className="nav-section">
          <div style={{ flex: 1, overflowY: "auto" }}>
            {/* Favorites */}
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: t.text3, marginBottom: 6 }}>
              Favorites
            </div>
            {
              favScripts.map(s => (<ScriptItemRow
                key={s.id}
                item={s}
                isFavorite={true}
                onToggleFavorite={() => toggleFav(s.id)}
                hoveredFav={hoveredFav}
                setHoveredFav={setHoveredFav}
                handleLaunch={handleLaunch}
                t={t}
              />))}
          </div>
        </section>

        <section className="nav-section script-list">
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: t.text3, marginBottom: 6 }}>
            All SCRIPTS
          </div>
          <span className="p-input-icon-right search-box" style={{ marginBottom: 6 }}>
            <i className="pi pi-search" />
            <InputText placeholder="Search SCRIPTS..." onChange={(e) => setSearch(e.target.value)} />
          </span>
          {filteredScripts.map((item) => (<ScriptItemRow
            key={item.id}
            item={item}
            isFavorite={favorites.has(item.id)}
            onToggleFavorite={() => toggleFav(item.id)}
            hoveredFav={hoveredFav}
            setHoveredFav={setHoveredFav}
            handleLaunch={handleLaunch}
            t={t}
          />))}
        </section>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">FBS</span>
            <span>BOOKLET<br />PLATFORM</span>
          </div>
          <StatusMetric icon="pi-play" label="Running" value="12" tone="green" />
          <Divider layout="vertical" />
          <StatusMetric icon="pi-clock" label="Waiting" value="3" tone="purple" />
          <Divider layout="vertical" />
          <StatusMetric icon="pi-check" label="Completed" value="28" tone="blue" />
          <Divider layout="vertical" />
          <StatusMetric icon="pi-exclamation-triangle" label="Failed" value="2" tone="red" />
          <div className="account-area">
            <Button
              icon={isDark ? "pi pi-sun" : "pi pi-moon"}
              className="theme-toggle"
              outlined
              rounded
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
              onClick={() => setTheme(isDark ? "light" : "dark")}
            />
            <span className="bell-wrap">
              <i className="pi pi-bell p-overlay-badge"><Badge value="3" severity="danger" /></i>
            </span>
            <span className="avatar">JD</span>
            <span className="user-copy"><strong>John Doe</strong><small>Administrator</small></span>
            <Button icon="pi pi-chevron-down" text rounded aria-label="Account menu" />
          </div>
        </header>

        <div className="overview-grid">
          <Card className="panel-card">
            <div className="panel-head">
              <h2>Job Queue <span>(12)</span></h2>
              <Button label="View All" text />
            </div>
            <div className="queue-list">
              {JOBS_MOCK.map(j => {
                const s = SCRIPTS.find(s => s.id === j.key) || null;
                if (!s) return null;
                return (
                  <div key={j.id} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                    borderBottom: `1px solid ${t.border}`,
                    transition: "background 0.1s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = t.surface2}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <StatusDot status={j.status} />
                    <ScriptIcon script={s} size={26} isDark={isDark} />
                    <span style={{ flex: 1, fontSize: 13, color: t.text, fontWeight: 500 }}>{j.label}</span>
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: j.status === "running" ? "#22c55e"
                        : j.status === "waiting_input" ? "#a855f7"
                          : "#f59e0b",
                    }}>
                      {j.status === "running" ? "Running" : j.status === "waiting_input" ? "Waiting Input" : "Queued"}
                    </span>
                    <span style={{ fontSize: 11, color: t.text3, fontFamily: "'IBM Plex Mono',monospace" }}>{j.time}</span>
                  </div>
                );
              })}
            </div>
            <button className="more-jobs">+6 more jobs <i className="pi pi-chevron-down" /></button>
          </Card>

          <Card className="panel-card">
            <div className="panel-head">
              <h2>Attention Center <span>(3)</span></h2>
              <Button label="View All" text />
            </div>
            <div className="attention-list">
              {ATTENTION_MOCK.map(a => {
                const s = SCRIPTS.find(s => s.id === a.key) || null;
                if (!s) return null;
                return (
                  <div key={a.id} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                    borderBottom: `1px solid ${t.border}`,
                  }}>
                    <ScriptIcon script={s} size={34} isDark={isDark} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: t.text }}>{a.label}</div>
                      <div style={{
                        fontSize: 12,
                        color: a.status === "waiting" ? "#a855f7" : "#ef4444",
                        fontWeight: 500,
                      }}>
                        {a.reason}
                      </div>
                      <div style={{ fontSize: 11, color: t.text3, marginTop: 1 }}>
                        {a.status === "waiting" ? "Requested:" : "Failed:"} {a.time}
                      </div>
                    </div>
                    <button style={{
                      padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      border: a.status === "waiting" ? "1.5px solid #7c3aed" : "1.5px solid #ef4444",
                      background: "transparent",
                      color: a.status === "waiting" ? "#7c3aed" : "#ef4444",
                      whiteSpace: "nowrap",
                    }}>
                      {a.status === "waiting" ? "Provide Input" : "View Details"}
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <section className="workspaces">
          <div className="section-head">
            <h2>Workspaces</h2>
            <div className="view-actions">
              <Button icon="pi pi-th-large" outlined aria-label="Grid view" className={viewMode === "grid" ? "active-view" : ""} onClick={() => setViewMode("grid")} />
              <Button icon="pi pi-list" outlined aria-label="List view" className={viewMode === "list" ? "active-view" : ""} onClick={() => setViewMode("list")} />
              <Button icon="pi pi-plus" label="Add Workspace" outlined />
            </div>
          </div>
          <div className={viewMode === "list" ? "workspace-grid workspace-list" : "workspace-grid"}>
            {WORKSPACE_MOCK.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                ws={workspace}
                t={t}
              />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
