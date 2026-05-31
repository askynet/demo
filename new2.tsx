import { useState, useRef, useEffect, useCallback, FC, KeyboardEvent } from "react";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

type JobStatus  = "running" | "waiting_input" | "completed" | "failed" | "queued";
type ThemeMode  = "light" | "dark";
type LogLevel   = "success" | "info" | "warning" | "error" | "input" | "output";

interface ScriptDef {
  key:         string;
  label:       string;
  category:    string;
  interactive: boolean;
  icon:        string;
  color:       string;
  bg:          string;
  restricted?: boolean;
}

interface LogEntry {
  time:    string;
  level:   LogLevel;
  text:    string;
  isInput?: boolean;
}

interface Job {
  id:          number;
  key:         string;
  label:       string;
  status:      JobStatus;
  time:        string;
  startedAgo?: string;
  server?:     string;
  logs:        LogEntry[];
  waitingPrompt?: string;
}

interface Theme {
  dark:     boolean;
  bg:       string;
  surface:  string;
  surface2: string;
  border:   string;
  border2:  string;
  text:     string;
  text2:    string;
  text3:    string;
  termBg:   string;
}

// ═══════════════════════════════════════════════════════════════════
// SCRIPT REGISTRY
// ═══════════════════════════════════════════════════════════════════

const SCRIPTS: ScriptDef[] = [
  { key:"assemble-pdf",           label:"Assemble PDF",              category:"Assembly",        interactive:true,  icon:"📚", color:"#ef4444", bg:"#fef2f2" },
  { key:"assemble-condensed",     label:"Assemble Condensed",        category:"Assembly",        interactive:true,  icon:"📋", color:"#f97316", bg:"#fff7ed" },
  { key:"retrieve-blocks",        label:"Retrieve Blocks",           category:"Editing",         interactive:true,  icon:"📥", color:"#3b82f6", bg:"#eff6ff" },
  { key:"checkin-bpl",            label:"Check In BPL",              category:"Version Control", interactive:true,  icon:"⬆️", color:"#22c55e", bg:"#f0fdf4" },
  { key:"shell-tool",             label:"Shell Tool",                category:"Utilities",       interactive:true,  icon:"⚙️", color:"#6b7280", bg:"#f9fafb", restricted:true },
  { key:"remove-revision",        label:"Remove Revision",           category:"Version Control", interactive:false, icon:"🗑️", color:"#ef4444", bg:"#fef2f2" },
  { key:"revision-info",          label:"Revision Info",             category:"Version Control", interactive:false, icon:"📄", color:"#3b82f6", bg:"#eff6ff" },
  { key:"checkout-bpl",           label:"Check Out BPL",             category:"Version Control", interactive:true,  icon:"⬇️", color:"#3b82f6", bg:"#eff6ff" },
  { key:"checkin-docid",          label:"Check In Docid",            category:"Version Control", interactive:true,  icon:"✅", color:"#22c55e", bg:"#f0fdf4" },
  { key:"checkout-docid",         label:"Check Out Docid",           category:"Version Control", interactive:true,  icon:"📂", color:"#3b82f6", bg:"#eff6ff" },
  { key:"checkout-rev-edit",      label:"Check Out Revision (Edit)", category:"Version Control", interactive:true,  icon:"✏️", color:"#6366f1", bg:"#eef2ff" },
  { key:"checkout-rev-view",      label:"Check Out Revision (View)", category:"Version Control", interactive:false, icon:"👁️", color:"#0ea5e9", bg:"#f0f9ff" },
  { key:"crisp",                  label:"Crisp Editor",              category:"Editing",         interactive:true,  icon:"✍️", color:"#a855f7", bg:"#faf5ff" },
  { key:"insert-customs",         label:"Insert Customs",            category:"Editing",         interactive:true,  icon:"🔧", color:"#f97316", bg:"#fff7ed" },
  { key:"insert-standard-blocks", label:"Insert Standard Blocks",    category:"Editing",         interactive:true,  icon:"🧱", color:"#84cc16", bg:"#f7fee7" },
  { key:"move-id",                label:"Move Id",                   category:"Utilities",       interactive:true,  icon:"🔀", color:"#ec4899", bg:"#fdf2f8" },
  { key:"copy-key",               label:"Password-less Auth",        category:"Utilities",       interactive:true,  icon:"🔑", color:"#f59e0b", bg:"#fffbeb" },
  { key:"list-revision",          label:"List File Revision",        category:"Version Control", interactive:false, icon:"📜", color:"#8b5cf6", bg:"#f5f3ff" },
  { key:"view-error-log",         label:"View Assembly Error File",  category:"Logs",            interactive:false, icon:"⚠️", color:"#ef4444", bg:"#fef2f2" },
  { key:"view-custom-log",        label:"View Custom Insert Log",    category:"Logs",            interactive:false, icon:"📄", color:"#6b7280", bg:"#f9fafb" },
  { key:"unlock-revision",        label:"Unlock Revision (BPL)",     category:"Version Control", interactive:false, icon:"🔓", color:"#22c55e", bg:"#f0fdf4" },
];

// ═══════════════════════════════════════════════════════════════════
// INITIAL JOB DATA
// ═══════════════════════════════════════════════════════════════════

const INITIAL_JOBS: Job[] = [
  {
    id: 1, key:"assemble-pdf", label:"Assemble PDF", status:"running",
    time:"10:21 AM", startedAgo:"2m 31s ago", server:"Linux Server 01",
    logs: [
      { time:"10:21:34", level:"success", text:"Connected to Linux Server 01" },
      { time:"10:21:42", level:"success", text:"BPL source loaded successfully" },
      { time:"10:21:51", level:"success", text:"Variables generated (165 items)" },
      { time:"10:22:03", level:"info",    text:"Preparing to generate booklet content..." },
      { time:"10:22:07", level:"info",    text:"Validating input parameters..." },
      { time:"10:22:09", level:"warning", text:"Input required:\n      Enter filename (including path):", isInput:false },
      { time:"10:21:11", level:"input",   text:"REVISION_2026_001" },
      { time:"10:22:11", level:"success", text:"Filename received: REVISION_2026_001" },
      { time:"10:22:15", level:"info",    text:"Checking file existence..." },
      { time:"10:22:16", level:"success", text:"File found" },
      { time:"10:22:18", level:"info",    text:"Generating booklet content..." },
      { time:"10:22:24", level:"info",    text:"Processing pages (1 - 50)" },
      { time:"10:22:29", level:"info",    text:"Processing pages (51 - 100)" },
      { time:"10:22:34", level:"info",    text:"Processing pages (101 - 150)" },
      { time:"10:22:37", level:"warning", text:"Minor warning: Image DPI is lower than recommended for page 112" },
      { time:"10:22:41", level:"info",    text:"Processing pages (151 - 165)" },
      { time:"10:22:45", level:"success", text:"Booklet content generated successfully" },
      { time:"10:22:47", level:"info",    text:"Compressing output..." },
      { time:"10:22:51", level:"success", text:"Output file created: /output/REVISION_2026_001.pdf" },
      { time:"10:22:52", level:"info",    text:"Job completed successfully" },
    ],
    waitingPrompt: undefined,
  },
  {
    id:2, key:"retrieve-blocks", label:"Retrieve Blocks", status:"running",
    time:"10:22 AM", server:"Linux Server 01",
    logs:[
      { time:"10:22:11", level:"success", text:"Connected to Linux Server 01" },
      { time:"10:22:18", level:"info",    text:"Reading revision list" },
      { time:"10:22:28", level:"info",    text:"Retrieving textblocks..." },
    ],
  },
  {
    id:3, key:"checkin-bpl", label:"Check In BPL", status:"waiting_input",
    time:"10:23 AM", server:"Linux Server 01",
    waitingPrompt:"Enter filename (including path):",
    logs:[
      { time:"10:23:01", level:"success", text:"Connected to Linux Server 01" },
      { time:"10:23:10", level:"info",    text:"Scanning BPL files..." },
      { time:"10:23:15", level:"warning", text:"Input required:\n      Enter filename (including path):" },
    ],
  },
  {
    id:4, key:"shell-tool", label:"Shell Tool", status:"running",
    time:"10:24 AM", server:"Linux Server 01",
    logs:[
      { time:"10:24:02", level:"success", text:"Connected to Linux Server 01" },
      { time:"10:24:05", level:"info",    text:"Command prepared" },
      { time:"10:24:06", level:"info",    text:"Executing..." },
    ],
  },
  {
    id:5, key:"remove-revision", label:"Remove Revision", status:"failed",
    time:"10:28 AM", server:"Linux Server 01",
    logs:[
      { time:"10:28:01", level:"success", text:"Connected to Linux Server 01" },
      { time:"10:28:10", level:"error",   text:"Permission denied: Cannot remove locked revision" },
      { time:"10:28:10", level:"error",   text:"Job failed with exit code 1" },
    ],
  },
  {
    id:6, key:"revision-info", label:"Revision Info", status:"completed",
    time:"10:18 AM", server:"Linux Server 01",
    logs:[
      { time:"10:18:01", level:"success", text:"Connected to Linux Server 01" },
      { time:"10:18:05", level:"info",    text:"Fetching revision info..." },
      { time:"10:18:09", level:"success", text:"Revision info retrieved successfully" },
    ],
  },
  {
    id:7, key:"checkout-bpl", label:"Check Out BPL", status:"completed",
    time:"10:15 AM", server:"Linux Server 01",
    logs:[
      { time:"10:15:01", level:"success", text:"Connected to Linux Server 01" },
      { time:"10:15:08", level:"success", text:"BPL files checked out successfully" },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════════════

function useTheme(mode: ThemeMode): Theme {
  const dark = mode === "dark";
  return {
    dark,
    bg:       dark ? "#0f1623" : "#f4f6fa",
    surface:  dark ? "#161e2e" : "#ffffff",
    surface2: dark ? "#1c2640" : "#f8fafc",
    border:   dark ? "#243049" : "#e8edf5",
    border2:  dark ? "#2d3f60" : "#d1dae8",
    text:     dark ? "#e2eaf6" : "#0f172a",
    text2:    dark ? "#8fa3c0" : "#475569",
    text3:    dark ? "#4a6080" : "#94a3b8",
    termBg:   dark ? "#0d1117" : "#111827",
  };
}

// ═══════════════════════════════════════════════════════════════════
// STATUS CONFIG
// ═══════════════════════════════════════════════════════════════════

const STATUS_CFG: Record<JobStatus, { color: string; label: string; dot: string; bg: string; border: string }> = {
  running:       { color:"#f97316", label:"Running",       dot:"#f97316", bg:"#fff7ed", border:"#fed7aa" },
  waiting_input: { color:"#a855f7", label:"Waiting Input", dot:"#a855f7", bg:"#faf5ff", border:"#d8b4fe" },
  completed:     { color:"#22c55e", label:"Completed",     dot:"#22c55e", bg:"#f0fdf4", border:"#bbf7d0" },
  failed:        { color:"#ef4444", label:"Failed",        dot:"#ef4444", bg:"#fef2f2", border:"#fecaca" },
  queued:        { color:"#64748b", label:"Queued",        dot:"#94a3b8", bg:"#f8fafc", border:"#e2e8f0" },
};

// ═══════════════════════════════════════════════════════════════════
// LOG COLORS (terminal)
// ═══════════════════════════════════════════════════════════════════

const LOG_COLOR: Record<LogLevel, string> = {
  success: "#4ade80",
  info:    "#94a3b8",
  warning: "#fb923c",
  error:   "#f87171",
  input:   "#60a5fa",
  output:  "#e2eaf6",
};

const LOG_PREFIX: Record<LogLevel, string> = {
  success: "[✓]",
  info:    "[i]",
  warning: "[!]",
  error:   "[✗]",
  input:   ">",
  output:  "",
};

// ═══════════════════════════════════════════════════════════════════
// SCRIPT ICON
// ═══════════════════════════════════════════════════════════════════

const ScriptIcon: FC<{ script: ScriptDef; size?: number; t: Theme }> = ({ script, size = 34, t }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.26, flexShrink: 0,
    background: t.dark ? script.color + "28" : script.bg,
    border: `1.5px solid ${script.color}44`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.45,
  }}>
    {script.icon}
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// STATUS PILL
// ═══════════════════════════════════════════════════════════════════

const StatusPill: FC<{ status: JobStatus }> = ({ status }) => {
  const cfg = STATUS_CFG[status];
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
      letterSpacing: "0.02em",
    }}>
      {cfg.label}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════
// STATUS DOT
// ═══════════════════════════════════════════════════════════════════

const StatusDot: FC<{ status: JobStatus }> = ({ status }) => {
  const cfg = STATUS_CFG[status];
  const pulse = status === "running" || status === "waiting_input";
  return (
    <span style={{
      width: 8, height: 8, borderRadius: "50%", display: "inline-block",
      background: cfg.dot, flexShrink: 0,
      animation: pulse ? "dotPulse 2s ease-in-out infinite" : "none",
    }} />
  );
};

// ═══════════════════════════════════════════════════════════════════
// LAUNCH DIALOG
// ═══════════════════════════════════════════════════════════════════

const LaunchDialog: FC<{ t: Theme; onClose: () => void; onLaunch: (key: string) => void }> = ({ t, onClose, onLaunch }) => {
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const filtered = SCRIPTS.filter(s => s.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:"#00000066", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", animation:"fadeIn 0.15s ease" }}>
      <div ref={ref} style={{ width:540, maxHeight:"75vh", background:t.surface, borderRadius:14, overflow:"hidden", boxShadow:"0 24px 80px #00000044", border:`1px solid ${t.border2}`, display:"flex", flexDirection:"column", animation:"slideUp 0.2s ease" }}>
        {/* Header */}
        <div style={{ padding:"18px 20px 14px", borderBottom:`1px solid ${t.border}`, display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#1d4ed8,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>⚡</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:16, color:t.text }}>Launch Script</div>
            <div style={{ fontSize:12, color:t.text3, marginTop:1 }}>Choose a script to run as a new job</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:t.text3, fontSize:20, lineHeight:1, padding:"2px 6px" }}>✕</button>
        </div>

        {/* Search */}
        <div style={{ padding:"12px 16px 8px" }}>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:t.text3, fontSize:14 }}>🔍</span>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search scripts..." onKeyDown={e => e.key==="Escape" && onClose()}
              style={{ width:"100%", padding:"9px 12px 9px 34px", background:t.surface2, border:`1px solid ${t.border2}`, borderRadius:8, color:t.text, fontSize:13, outline:"none", fontFamily:"inherit" }}/>
            <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:11, color:t.text3, background:t.surface2, padding:"1px 6px", borderRadius:4, border:`1px solid ${t.border}` }}>⌘K</span>
          </div>
        </div>

        {/* List */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {filtered.length === 0 && (
            <div style={{ padding:"32px", textAlign:"center", color:t.text3, fontSize:13 }}>No scripts match "{search}"</div>
          )}
          {filtered.map(s => (
            <div key={s.key} onClick={() => setSelected(s.key)}
              style={{
                display:"flex", alignItems:"center", gap:12, padding:"10px 18px",
                cursor:"pointer", borderLeft:`3px solid ${selected===s.key?"#1d4ed8":"transparent"}`,
                background: selected===s.key ? (t.dark?"#1e3a8a18":"#eff6ff") : "transparent",
                transition:"all 0.1s",
              }}
              onMouseEnter={e => { if(selected!==s.key)(e.currentTarget as HTMLDivElement).style.background = t.surface2; }}
              onMouseLeave={e => { if(selected!==s.key)(e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
            >
              <ScriptIcon script={s} size={34} t={t}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13.5, fontWeight:500, color:t.text }}>{s.label}</div>
                <div style={{ display:"flex", gap:8, marginTop:2, alignItems:"center" }}>
                  <span style={{ fontSize:11, color:s.color, fontWeight:500 }}>{s.category}</span>
                  <span style={{ fontSize:11, color:t.text3 }}>·</span>
                  <span style={{ fontSize:11, color:s.interactive?"#22c55e":t.text3 }}>{s.interactive?"interactive":"view only"}</span>
                  {s.restricted && <span style={{ fontSize:10, color:"#ef4444", background:"#ef444418", border:"1px solid #ef444433", borderRadius:4, padding:"0 5px", fontWeight:600 }}>ADMIN</span>}
                </div>
              </div>
              {selected===s.key && <span style={{ color:"#1d4ed8", fontSize:16 }}>✓</span>}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding:"12px 18px", borderTop:`1px solid ${t.border}`, display:"flex", gap:8, justifyContent:"flex-end", alignItems:"center" }}>
          <span style={{ fontSize:11, color:t.text3, flex:1 }}>{filtered.length} scripts</span>
          <button onClick={onClose} style={{ padding:"8px 18px", borderRadius:8, border:`1px solid ${t.border2}`, background:"transparent", color:t.text2, fontSize:13, cursor:"pointer" }}>Cancel</button>
          <button onClick={() => { if(selected){ onLaunch(selected); onClose(); }}} disabled={!selected}
            style={{ padding:"8px 22px", borderRadius:8, border:"none", background:selected?"#1d4ed8":t.border2, color:selected?"#fff":t.text3, fontSize:13, fontWeight:600, cursor:selected?"pointer":"default", transition:"all 0.15s" }}>
            ▶ Launch
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// TERMINAL PANEL
// ═══════════════════════════════════════════════════════════════════

const TerminalPanel: FC<{
  job:       Job;
  t:         Theme;
  onSend:    (id: number, val: string) => void;
  onStop:    (id: number) => void;
  autoScroll:boolean;
  setAutoScroll: (v: boolean) => void;
}> = ({ job, t, onSend, onStop, autoScroll, setAutoScroll }) => {
  const script   = SCRIPTS.find(s => s.key === job.key) ?? SCRIPTS[0];
  const [cmd, setCmd]     = useState("");
  const [waitInput, setWaitInput] = useState("");
  const bottomRef         = useRef<HTMLDivElement>(null);
  const outputRef         = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [job.logs, autoScroll]);

  const sendCmd = useCallback(() => {
    if (!cmd.trim()) return;
    onSend(job.id, cmd.trim());
    setCmd("");
  }, [cmd, job.id, onSend]);

  const sendWait = useCallback(() => {
    if (!waitInput.trim()) return;
    onSend(job.id, waitInput.trim());
    setWaitInput("");
  }, [waitInput, job.id, onSend]);

  const handleScroll = () => {
    if (!outputRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = outputRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 40);
  };

  const isAlive = job.status === "running" || job.status === "waiting_input";

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:t.surface }}>

      {/* ── Job detail header ── */}
      <div style={{
        display:"flex", alignItems:"center", gap:14, padding:"16px 24px",
        borderBottom:`1px solid ${t.border}`, flexShrink:0,
      }}>
        <ScriptIcon script={script} size={42} t={t}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <span style={{ fontWeight:700, fontSize:20, color:t.text, letterSpacing:"-0.4px" }}>{job.label}</span>
            <StatusPill status={job.status}/>
          </div>
          <div style={{ display:"flex", gap:16, marginTop:4, flexWrap:"wrap" }}>
            {job.startedAgo && (
              <span style={{ fontSize:12, color:t.text2 }}>
                Started: <span style={{ color:t.text3 }}>{job.time} ({job.startedAgo})</span>
              </span>
            )}
            {job.server && (
              <span style={{ fontSize:12, color:t.text2 }}>
                Server: <span style={{ color:t.text3 }}>{job.server}</span>
              </span>
            )}
          </div>
        </div>
        <div style={{ display:"flex", gap:8, flexShrink:0 }}>
          {isAlive && (
            <button onClick={() => onStop(job.id)} style={{
              display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:8,
              border:"1.5px solid #ef4444", background:"transparent",
              color:"#ef4444", fontSize:13, fontWeight:600, cursor:"pointer",
            }}>
              <span style={{ width:12, height:12, borderRadius:2, border:"2px solid #ef4444", display:"flex", alignItems:"center", justifyContent:"center", fontSize:7 }}>■</span>
              Stop Job
            </button>
          )}
          <button style={{
            display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:8,
            border:`1px solid ${t.border2}`, background:"transparent",
            color:t.text2, fontSize:13, fontWeight:500, cursor:"pointer",
          }}>
            ⋯ More
          </button>
        </div>
      </div>

      {/* ── Streaming output header ── */}
      <div style={{
        display:"flex", alignItems:"center", padding:"10px 20px",
        borderBottom:`1px solid ${t.border}`, flexShrink:0,
        background: t.dark ? "#0d1117" : "#111827",
      }}>
        <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", color:"#475569", flex:1, textTransform:"uppercase" }}>Streaming Output</span>
        <button style={{ display:"flex", alignItems:"center", gap:5, background:"none", border:"none", cursor:"pointer", color:"#475569", fontSize:12, padding:"2px 10px" }}>
          🗑 Clear
        </button>
        <button style={{ display:"flex", alignItems:"center", gap:5, background:"none", border:"none", cursor:"pointer", color:"#475569", fontSize:12, padding:"2px 10px" }}>
          ↓ Download Log
        </button>
      </div>

      {/* ── Log output ── */}
      <div
        ref={outputRef}
        onScroll={handleScroll}
        style={{
          flex:1, overflowY:"auto", padding:"16px 24px",
          background: t.dark ? "#0d1117" : "#111827",
          fontFamily:"'IBM Plex Mono','Fira Code',monospace",
        }}
      >
        {job.logs.map((l, i) => {
          if (l.level === "input") {
            return (
              <div key={i} style={{ display:"flex", gap:14, padding:"1px 0", fontSize:13, lineHeight:1.7, color:"#60a5fa" }}>
                <span style={{ color:"#374151", flexShrink:0, userSelect:"none", width:52 }}>{l.time}</span>
                <span style={{ color:"#60a5fa" }}>&gt; {l.text}</span>
              </div>
            );
          }

          // Inline input prompt rendering
          const hasPrompt = l.level === "warning" && l.text.includes("Input required:");
          const isWaitingHere = hasPrompt && job.status === "waiting_input" && i === job.logs.length - 1;

          return (
            <div key={i}>
              <div style={{ display:"flex", gap:14, padding:"1px 0", fontSize:13, lineHeight:1.7 }}>
                <span style={{ color:"#374151", flexShrink:0, userSelect:"none", width:52 }}>{l.time}</span>
                <span style={{ color: LOG_COLOR[l.level] }}>
                  {LOG_PREFIX[l.level] && <span style={{ marginRight:8, opacity:0.9 }}>{LOG_PREFIX[l.level]}</span>}
                  {l.text.split("\n").map((line, li) => (
                    <span key={li}>
                      {li > 0 && <br/>}
                      {li > 0 ? <span style={{ color: LOG_COLOR[l.level] }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{line}</span> : line}
                    </span>
                  ))}
                </span>
              </div>
              {/* Inline input field at the prompt */}
              {isWaitingHere && (
                <div style={{ display:"flex", gap:14, padding:"8px 0 12px", marginLeft:66 }}>
                  <div style={{ display:"flex", gap:8, flex:1, maxWidth:540 }}>
                    <input
                      autoFocus
                      value={waitInput}
                      onChange={e => setWaitInput(e.target.value)}
                      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && sendWait()}
                      placeholder="REVISION_2026_001"
                      style={{
                        flex:1, padding:"9px 14px",
                        background:"#1e293b", border:"1.5px solid #3b82f6",
                        borderRadius:8, fontSize:13, color:"#e2eaf6",
                        outline:"none", fontFamily:"'IBM Plex Mono',monospace",
                      }}
                    />
                    <button onClick={sendWait} style={{
                      padding:"9px 20px", borderRadius:8, border:"none",
                      background:"#1d4ed8", color:"#fff", fontWeight:700,
                      fontSize:13, cursor:"pointer", fontFamily:"'IBM Plex Sans',sans-serif",
                    }}>Send</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      {/* ── Command input bar ── */}
      <div style={{
        display:"flex", alignItems:"center", gap:10,
        padding:"10px 16px 10px 20px",
        borderTop:`1px solid #1e293b`,
        background: t.dark ? "#0d1117" : "#111827",
        flexShrink:0,
      }}>
        <input
          value={cmd}
          onChange={e => setCmd(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && sendCmd()}
          placeholder="Type a command (if supported)..."
          style={{
            flex:1, padding:"9px 14px", background:"transparent", border:"none",
            color:"#64748b", fontSize:13, outline:"none",
            fontFamily:"'IBM Plex Mono',monospace",
          }}
        />
        <button onClick={sendCmd} style={{
          width:34, height:34, borderRadius:8,
          background:"#1e293b", border:"none", cursor:"pointer",
          color:"#475569", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center",
          transition:"all 0.15s",
        }}
        onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="#1d4ed8";(e.currentTarget as HTMLButtonElement).style.color="#fff";}}
        onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="#1e293b";(e.currentTarget as HTMLButtonElement).style.color="#475569";}}
        >
          ➤
        </button>

        {/* Auto-scroll toggle */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:8, paddingLeft:16, borderLeft:"1px solid #1e293b" }}>
          <span style={{ fontSize:12, color:"#475569", whiteSpace:"nowrap" }}>Auto-scroll</span>
          <div
            onClick={() => setAutoScroll(!autoScroll)}
            style={{
              width:38, height:22, borderRadius:11, cursor:"pointer",
              background: autoScroll ? "#1d4ed8" : "#1e293b",
              border: `1px solid ${autoScroll ? "#1d4ed8" : "#334155"}`,
              position:"relative", transition:"all 0.2s",
            }}
          >
            <div style={{
              width:16, height:16, borderRadius:"50%", background:"#fff",
              position:"absolute", top:2,
              left: autoScroll ? 18 : 2,
              transition:"left 0.2s",
              boxShadow:"0 1px 4px #00000033",
            }}/>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// SIDEBAR JOB ITEM
// ═══════════════════════════════════════════════════════════════════

const SidebarJob: FC<{ job: Job; active: boolean; onClick: () => void; t: Theme }> = ({ job, active, onClick, t }) => {
  const script = SCRIPTS.find(s => s.key === job.key) ?? SCRIPTS[0];
  const cfg    = STATUS_CFG[job.status];

  return (
    <div
      onClick={onClick}
      style={{
        display:"flex", alignItems:"center", gap:10, padding:"11px 16px",
        cursor:"pointer", transition:"background 0.1s",
        background: active ? (t.dark?"#1e3a8a18":"#eff6ff") : "transparent",
        borderLeft: `3px solid ${active?"#1d4ed8":"transparent"}`,
      }}
      onMouseEnter={e => { if (!active)(e.currentTarget as HTMLDivElement).style.background = t.surface2; }}
      onMouseLeave={e => { if (!active)(e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
    >
      <div style={{ position:"relative", flexShrink:0 }}>
        <ScriptIcon script={script} size={36} t={t}/>
        <StatusDot status={job.status}/>
        <span style={{
          position:"absolute", bottom:-2, right:-2,
          width:10, height:10, borderRadius:"50%",
          background: cfg.dot, border:`2px solid ${t.surface}`,
        }}/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:500, color:t.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{job.label}</div>
        <div style={{ fontSize:11, fontWeight:500, color:cfg.color, marginTop:1 }}>
          {job.status === "completed" ? "Completed" : job.status === "failed" ? "Failed" : cfg.label}
        </div>
      </div>
      <span style={{ fontSize:11, color:t.text3, flexShrink:0, fontFamily:"'IBM Plex Mono',monospace" }}>{job.time}</span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════

export default function FBSPlatform(): JSX.Element {
  const [themeMode, setThemeMode]   = useState<ThemeMode>("light");
  const t                           = useTheme(themeMode);
  const [jobs, setJobs]             = useState<Job[]>(INITIAL_JOBS);
  const [activeJobId, setActiveJobId] = useState<number>(1);
  const [showLaunch, setShowLaunch] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [search, setSearch]         = useState("");

  const activeJob = jobs.find(j => j.id === activeJobId) ?? jobs[0];

  const liveJobs      = jobs.filter(j => j.status === "running" || j.status === "waiting_input");
  const completedJobs = jobs.filter(j => j.status === "completed");
  const failedJobs    = jobs.filter(j => j.status === "failed");

  const runningCount  = jobs.filter(j => j.status === "running").length;
  const waitingCount  = jobs.filter(j => j.status === "waiting_input").length;

  const filteredLive = liveJobs.filter(j => j.label.toLowerCase().includes(search.toLowerCase()));

  // ── handlers ──────────────────────────────────────────────────────

  const handleSend = useCallback((id: number, val: string) => {
    setJobs(prev => prev.map(j => {
      if (j.id !== id) return j;
      const now = new Date().toLocaleTimeString("en", { hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false });
      const newLogs: LogEntry[] = [
        ...j.logs,
        { time: now, level: "input",   text: val },
        { time: now, level: "success", text: `Filename received: ${val}` },
        { time: now, level:"info",     text: "Processing..." },
      ];
      return { ...j, logs: newLogs, status: "running", waitingPrompt: undefined };
    }));
  }, []);

  const handleStop = useCallback((id: number) => {
    setJobs(prev => prev.map(j => {
      if (j.id !== id) return j;
      const now = new Date().toLocaleTimeString("en", { hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false });
      return {
        ...j, status: "failed",
        logs: [...j.logs, { time: now, level: "error", text: "Job stopped by user" }],
      };
    }));
  }, []);

  const handleLaunch = useCallback((key: string) => {
    const script = SCRIPTS.find(s => s.key === key);
    if (!script) return;
    const now = new Date().toLocaleTimeString("en", { hour:"2-digit", minute:"2-digit", hour12:true });
    const nowSec = new Date().toLocaleTimeString("en", { hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false });
    const newJob: Job = {
      id: Date.now(), key, label: script.label, status: "running",
      time: now, startedAgo: "just now", server: "Linux Server 01",
      logs: [{ time: nowSec, level: "info", text: "Initialising..." }],
    };
    setJobs(prev => [newJob, ...prev]);
    setActiveJobId(newJob.id);
  }, []);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:t.bg, color:t.text, fontFamily:"'IBM Plex Sans','Geist',system-ui,sans-serif", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:${t.border2};border-radius:2px;}
        input::placeholder{color:#374151;}
        button{font-family:'IBM Plex Sans',system-ui,sans-serif;}
        @keyframes dotPulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
        @keyframes slideUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
      `}</style>

      {/* ═══ HEADER ═══ */}
      <header style={{
        height:60, flexShrink:0, background:t.surface,
        borderBottom:`1px solid ${t.border}`,
        display:"flex", alignItems:"center", padding:"0 20px 0 0",
      }}>
        {/* Logo area — matches sidebar width */}
        <div style={{ width:264, flexShrink:0, display:"flex", alignItems:"center", gap:10, padding:"0 20px", borderRight:`1px solid ${t.border}` }}>
          <div style={{ background:"#1d4ed8", borderRadius:8, padding:"4px 9px", fontWeight:800, fontSize:20, color:"#fff", letterSpacing:"-1px", lineHeight:1 }}>FBS</div>
          <span style={{ fontWeight:600, fontSize:15, color:t.text }}>Launcher</span>
        </div>

        {/* Stats */}
        <div style={{ display:"flex", alignItems:"center", gap:0, flex:1, padding:"0 28px" }}>
          {[
            { label:"Running",       value:runningCount, color:"#f97316" },
            { label:"Waiting Input", value:waitingCount, color:"#a855f7" },
            { label:"Completed",     value:completedJobs.length + 48, color:"#22c55e" },
            { label:"Failed",        value:failedJobs.length, color:"#ef4444" },
          ].map((s, i) => (
            <div key={s.label} style={{ display:"flex", alignItems:"center", gap:8, padding:"0 24px", borderRight:i<3?`1px solid ${t.border}`:"none" }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:s.color, display:"inline-block", flexShrink:0, animation: (i===0||i===1)?"dotPulse 2s ease-in-out infinite":"none" }}/>
              <div>
                <div style={{ fontSize:11, color:t.text2, fontWeight:500, lineHeight:1.2 }}>{s.label}</div>
                <div style={{ fontSize:22, fontWeight:800, color:t.text, letterSpacing:"-0.5px", lineHeight:1.1, fontVariantNumeric:"tabular-nums" }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Right actions */}
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          <button onClick={() => setThemeMode(m => m === "dark" ? "light" : "dark")}
            style={{ width:36, height:36, borderRadius:8, border:`1px solid ${t.border2}`, background:t.surface2, cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center", color:t.text2 }}
            title="Toggle theme">{t.dark ? "☀️" : "🌤"}</button>
          <div style={{ position:"relative" }}>
            <button style={{ width:36, height:36, borderRadius:8, border:`1px solid ${t.border2}`, background:t.surface2, cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center", color:t.text2 }}>🔔</button>
            <span style={{ position:"absolute", top:-5, right:-5, width:18, height:18, borderRadius:"50%", background:"#ef4444", color:"#fff", fontSize:10, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", border:`2px solid ${t.surface}` }}>3</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 10px", borderRadius:8, cursor:"pointer", border:`1px solid ${t.border}` }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#1d4ed8,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#fff", fontWeight:700 }}>JD</div>
            <span style={{ fontSize:13, fontWeight:500, color:t.text }}>JD</span>
            <span style={{ fontSize:10, color:t.text3 }}>▾</span>
          </div>
        </div>
      </header>

      {/* ═══ BODY ═══ */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* ═══ SIDEBAR ═══ */}
        <aside style={{
          width:264, flexShrink:0,
          background:t.surface, borderRight:`1px solid ${t.border}`,
          display:"flex", flexDirection:"column", overflow:"hidden",
        }}>
          {/* Launch button */}
          <div style={{ padding:"14px 12px 10px" }}>
            <button onClick={() => setShowLaunch(true)} style={{
              width:"100%", padding:"10px 0",
              background:"#1d4ed8", border:"none", borderRadius:8,
              color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              boxShadow:"0 2px 12px #1d4ed844",
            }}
            onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background="#1e40af"}
            onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background="#1d4ed8"}>
              + Launch Script
            </button>
          </div>

          {/* Search */}
          <div style={{ padding:"2px 12px 10px" }}>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", fontSize:13, color:t.text3 }}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search jobs..."
                style={{ width:"100%", padding:"7px 40px 7px 30px", background:t.surface2, border:`1px solid ${t.border}`, borderRadius:7, color:t.text, fontSize:12.5, outline:"none" }}/>
              <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", fontSize:10, color:t.text3, background:t.border, borderRadius:4, padding:"1px 5px" }}>⌘K</span>
            </div>
          </div>

          <div style={{ flex:1, overflowY:"auto" }}>
            {/* Active jobs */}
            <div style={{ padding:"2px 16px 6px" }}>
              <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:t.text3 }}>Jobs</div>
            </div>

            {filteredLive.map(j => (
              <SidebarJob key={j.id} job={j} active={j.id===activeJobId} onClick={()=>setActiveJobId(j.id)} t={t}/>
            ))}

            {/* Failed */}
            {failedJobs.filter(j=>j.label.toLowerCase().includes(search.toLowerCase())).map(j => (
              <SidebarJob key={j.id} job={j} active={j.id===activeJobId} onClick={()=>setActiveJobId(j.id)} t={t}/>
            ))}

            {/* Completed group */}
            {completedJobs.length > 0 && (
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px 6px", cursor:"pointer" }}>
                  <span style={{ fontSize:13, color:t.text2, fontWeight:500 }}>Completed ({completedJobs.length + 48})</span>
                  <span style={{ color:t.text3, fontSize:12 }}>›</span>
                </div>
                {completedJobs.filter(j=>j.label.toLowerCase().includes(search.toLowerCase())).map(j => (
                  <SidebarJob key={j.id} job={j} active={j.id===activeJobId} onClick={()=>setActiveJobId(j.id)} t={t}/>
                ))}
              </div>
            )}

            {/* Failed group */}
            {failedJobs.length > 0 && (
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 16px 6px", cursor:"pointer" }}>
                  <span style={{ fontSize:13, color:t.text2, fontWeight:500 }}>Failed ({failedJobs.length})</span>
                  <span style={{ color:t.text3, fontSize:12 }}>›</span>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div style={{ borderTop:`1px solid ${t.border}`, padding:"12px 16px" }}>
            <button style={{ display:"flex", alignItems:"center", gap:8, background:"none", border:"none", cursor:"pointer", color:t.text2, fontSize:13 }}>
              <span style={{ fontSize:15 }}>⚙️</span> Settings
            </button>
          </div>
        </aside>

        {/* ═══ MAIN TERMINAL ═══ */}
        {activeJob && (
          <TerminalPanel
            key={activeJob.id}
            job={activeJob}
            t={t}
            onSend={handleSend}
            onStop={handleStop}
            autoScroll={autoScroll}
            setAutoScroll={setAutoScroll}
          />
        )}
      </div>

      {/* ═══ LAUNCH DIALOG ═══ */}
      {showLaunch && <LaunchDialog t={t} onClose={() => setShowLaunch(false)} onLaunch={handleLaunch}/>}
    </div>
  );
}
