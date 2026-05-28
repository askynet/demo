import { useState, useEffect, useRef, useCallback } from "react";

// ─── SCRIPT REGISTRY ──────────────────────────────────────────────────────────
const SCRIPTS = [
  { key: "assemble-condensed",      label: "Assemble Condensed One Books",  category: "Assembly",        interactive: true,  icon: "📚" },
  { key: "assemble-print-pdf",      label: "Assemble Print Ready PDF",       category: "Assembly",        interactive: true,  icon: "🖨️" },
  { key: "checkin-bpl",             label: "Check In BPL Files",             category: "Version Control", interactive: true,  icon: "⬆️" },
  { key: "checkin-docid",           label: "Check In Docid",                 category: "Version Control", interactive: true,  icon: "✅" },
  { key: "checkout-docid",          label: "Check Out Docid",                category: "Version Control", interactive: true,  icon: "⬇️" },
  { key: "checkout-revision-edit",  label: "Check Out Revision (Edit)",      category: "Version Control", interactive: true,  icon: "✏️" },
  { key: "checkout-revision-view",  label: "Check Out Revision (View)",      category: "Version Control", interactive: false, icon: "👁️" },
  { key: "checkout-bpl",            label: "Checkout BPL Files",             category: "Version Control", interactive: true,  icon: "📂" },
  { key: "cit-booklet-ordering",    label: "Cit Booklet Ordering",           category: "Assembly",        interactive: true,  icon: "📋" },
  { key: "crisp",                   label: "Crisp Editor",                   category: "Editing",         interactive: true,  icon: "✍️" },
  { key: "insert-customs",          label: "Insert Customs",                 category: "Editing",         interactive: true,  icon: "🔧" },
  { key: "insert-standard-blocks",  label: "Insert Standard Blocks",         category: "Editing",         interactive: true,  icon: "🧱" },
  { key: "list-file-revision",      label: "List File Revision Info",        category: "Utilities",       interactive: false, icon: "📜" },
  { key: "move-id",                 label: "Move Id",                        category: "Utilities",       interactive: true,  icon: "🔀" },
  { key: "copy-key",                label: "Password-less Authentication",   category: "Utilities",       interactive: true,  icon: "🔑" },
  { key: "remove-revision",         label: "Remove Revision (BPL file)",     category: "Version Control", interactive: false, icon: "🗑️" },
  { key: "retrieve-textblocks",     label: "Retrieve Textblocks",            category: "Editing",         interactive: true,  icon: "📥" },
  { key: "shell",                   label: "ShellTool",                      category: "Utilities",       interactive: true,  restricted: true, icon: "💻" },
  { key: "unlock-revision",         label: "Unlock Revision (BPL file)",     category: "Version Control", interactive: false, icon: "🔓" },
  { key: "view-error-log",          label: "View Assembly Error File",       category: "Logs",            interactive: false, icon: "⚠️" },
  { key: "view-custom-log",         label: "View Custom Insert Log File",    category: "Logs",            interactive: false, icon: "📄" },
];

const CATEGORIES = ["Assembly", "Version Control", "Editing", "Utilities", "Logs"];

const CAT_ACCENT = {
  Assembly:        "#4ade80",
  "Version Control": "#60a5fa",
  Editing:         "#c084fc",
  Utilities:       "#fbbf24",
  Logs:            "#f87171",
};

// ─── DEMO SCRIPT SEQUENCES ────────────────────────────────────────────────────
const SEQUENCES = {
  "assemble-condensed": [
    { delay: 200,  type: "stdout", data: "Starting Condensed One Books Assembly...\r\n" },
    { delay: 600,  type: "stdout", data: "Loading configuration...\r\n" },
    { delay: 1100, type: "stdout", data: "Found \x1b[33m12\x1b[0m BPL templates.\r\n" },
    { delay: 1600, type: "stdout", data: "Fetching variables from CIY...\r\n" },
    { delay: 2200, type: "prompt", data: "Enter document ID: " },
  ],
  "assemble-print-pdf": [
    { delay: 300,  type: "stdout", data: "Initialising PDF assembly pipeline...\r\n" },
    { delay: 800,  type: "stdout", data: "Locating RAW source files...\r\n" },
    { delay: 1400, type: "stdout", data: "\x1b[32m✓\x1b[0m 8 RAW files located.\r\n" },
    { delay: 1900, type: "stdout", data: "Sending to Windows PDF service...\r\n" },
    { delay: 3200, type: "stdout", data: "\x1b[32m✓\x1b[0m PDF generated: /output/booklet_20260528.pdf\r\n" },
    { delay: 3400, type: "exit",   data: { code: 0 } },
  ],
  "view-error-log": [
    { delay: 200,  type: "stdout", data: "\x1b[1mAssembly Error Log — Last Run\x1b[0m\r\n" },
    { delay: 300,  type: "stdout", data: "──────────────────────────────\r\n" },
    { delay: 500,  type: "stderr", data: "[ERROR 14:32:01] BPL template not found: cover_v2.bpl\r\n" },
    { delay: 700,  type: "stderr", data: "[ERROR 14:32:03] Variable CIY_REF_ID undefined\r\n" },
    { delay: 900,  type: "stdout", data: "[INFO  14:32:05] Fallback template applied.\r\n" },
    { delay: 1100, type: "stdout", data: "[INFO  14:32:07] Assembly completed with warnings.\r\n" },
    { delay: 1300, type: "exit",   data: { code: 0 } },
  ],
  "list-file-revision": [
    { delay: 300,  type: "stdout", data: "\x1b[1mFile Revision Info\x1b[0m\r\n──────────────────────────────────────\r\n" },
    { delay: 600,  type: "stdout", data: "cover.blk          rev 4   \x1b[31mlocked\x1b[0m  jsmith   2026-05-20\r\n" },
    { delay: 800,  type: "stdout", data: "chapter1.blk       rev 7   \x1b[32mfree\x1b[0m             2026-05-22\r\n" },
    { delay: 1000, type: "stdout", data: "chapter2.blk       rev 3   \x1b[31mlocked\x1b[0m  ajones   2026-05-27\r\n" },
    { delay: 1200, type: "stdout", data: "appendix.blk       rev 1   \x1b[32mfree\x1b[0m             2026-05-15\r\n" },
    { delay: 1400, type: "exit",   data: { code: 0 } },
  ],
  "checkin-bpl": [
    { delay: 400,  type: "stdout", data: "Scanning for modified BPL files...\r\n" },
    { delay: 900,  type: "stdout", data: "Found: chapter1.bpl, appendix.bpl\r\n" },
    { delay: 1400, type: "prompt", data: "Confirm check-in? [y/n]: " },
  ],
  "shell": [
    { delay: 200,  type: "stdout", data: "\x1b[32mtcsh\x1b[0m 6.21 — FBS Shell Environment\r\n" },
    { delay: 400,  type: "stdout", data: "% " },
  ],
  "_default": [
    { delay: 300,  type: "stdout", data: "Initialising...\r\n" },
    { delay: 700,  type: "stdout", data: "Connecting to Linux server...\r\n" },
    { delay: 1200, type: "stdout", data: "\x1b[32m✓ Connected\x1b[0m\r\n" },
    { delay: 1700, type: "stdout", data: "Ready.\r\n" },
    { delay: 2200, type: "exit",   data: { code: 0 } },
  ],
};

// ─── STRIP ANSI ───────────────────────────────────────────────────────────────
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");

// ─── ANSI → SPANS ─────────────────────────────────────────────────────────────
const ANSI_COLORS = {
  "30":"#4b5563","31":"#f87171","32":"#4ade80","33":"#fbbf24",
  "34":"#60a5fa","35":"#c084fc","36":"#22d3ee","37":"#e5e7eb",
};
function AnsiLine({ text }) {
  const parts = [];
  const re = /\x1b\[([0-9;]*)m/g;
  let last = 0, color = null, bold = false, key = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={key++} style={{ color: color || "inherit", fontWeight: bold ? 700 : 400 }}>{text.slice(last, m.index)}</span>);
    const codes = m[1].split(";");
    for (const c of codes) {
      if (c === "0" || c === "") { color = null; bold = false; }
      else if (c === "1") bold = true;
      else if (ANSI_COLORS[c]) color = ANSI_COLORS[c];
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<span key={key++} style={{ color: color || "inherit", fontWeight: bold ? 700 : 400 }}>{text.slice(last)}</span>);
  return <>{parts}</>;
}

// ─── JOB STATE MACHINE ────────────────────────────────────────────────────────
let _jobSeq = 1;
function createJob(script) {
  return {
    id: `job-${_jobSeq++}`,
    script,
    status: "running",    // running | waiting_input | completed | error | killed
    lines: [],
    startedAt: Date.now(),
    endedAt: null,
    pendingPrompt: null,  // prompt text when waiting for input
  };
}

// ─── TERMINAL LINE ────────────────────────────────────────────────────────────
function TermLine({ line }) {
  const color = line.type === "stderr" ? "#f87171" : line.type === "stdin" ? "#60a5fa" : "#d4d4d4";
  return (
    <div style={{ color, fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
      {line.type === "stdin" && <span style={{ color: "#4b5563", marginRight: 4 }}>{">"}</span>}
      <AnsiLine text={line.data} />
    </div>
  );
}

// ─── TERMINAL PANEL ───────────────────────────────────────────────────────────
function TerminalPanel({ job, onInput, onKill }) {
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const [draft, setDraft] = useState("");

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [job?.lines]);
  useEffect(() => { if (job?.status === "waiting_input") inputRef.current?.focus(); }, [job?.status]);

  if (!job) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⬆️</div>
        <div style={{ fontSize: 14, fontFamily: "'JetBrains Mono',monospace" }}>Select an active job from the panel above</div>
      </div>
    </div>
  );

  const accent = CAT_ACCENT[job.script.category] || "#60a5fa";

  const statusBadge = {
    running:       <span style={{ color:"#fbbf24", display:"flex", alignItems:"center", gap:5, fontSize:12 }}><Blink color="#fbbf24"/>Running</span>,
    waiting_input: <span style={{ color:"#c084fc", display:"flex", alignItems:"center", gap:5, fontSize:12 }}><Blink color="#c084fc"/>Awaiting Input</span>,
    completed:     <span style={{ color:"#4ade80", fontSize:12 }}>✓ Completed</span>,
    error:         <span style={{ color:"#f87171", fontSize:12 }}>✗ Error</span>,
    killed:        <span style={{ color:"#6b7280", fontSize:12 }}>⊘ Killed</span>,
  }[job.status];

  const elapsed = job.endedAt
    ? ((job.endedAt - job.startedAt) / 1000).toFixed(1) + "s"
    : ((Date.now() - job.startedAt) / 1000).toFixed(0) + "s";

  const submit = () => {
    if (!draft.trim()) return;
    onInput(job.id, draft);
    setDraft("");
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Term header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "9px 16px",
        background: "#0d1117", borderBottom: "1px solid #21262d", flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: 5 }}>
          {["#ff5f57","#febc2e","#28c840"].map((c,i) => (
            <div key={i} style={{ width:11, height:11, borderRadius:"50%", background:c }} />
          ))}
        </div>
        <span style={{ color:"#8b949e", fontFamily:"monospace", fontSize:12, marginLeft:6 }}>
          {job.script.icon} {job.script.label}
          <span style={{ color:"#374151", marginLeft:8 }}>#{job.id}</span>
        </span>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ color:"#374151", fontSize:11, fontFamily:"monospace" }}>{elapsed}</span>
          {statusBadge}
          {(job.status === "running" || job.status === "waiting_input") && (
            <button onClick={() => onKill(job.id)} style={{
              padding:"2px 10px", borderRadius:4, border:"1px solid #374151",
              background:"transparent", color:"#6b7280", fontSize:11, cursor:"pointer",
            }}>Kill</button>
          )}
        </div>
      </div>

      {/* Output */}
      <div style={{ flex:1, overflowY:"auto", padding:"14px 16px", background:"#010409" }}>
        <div style={{ color:"#374151", fontFamily:"monospace", fontSize:11, marginBottom:10 }}>
          $ {job.script.label.toLowerCase().replace(/ /g,"_")}
        </div>
        {job.lines.map((l, i) => <TermLine key={i} line={l} />)}

        {/* Prompt + input */}
        {job.status === "waiting_input" && (
          <div style={{ display:"flex", alignItems:"center", marginTop:6, gap:6 }}>
            <span style={{ color:accent, fontFamily:"monospace", fontSize:12 }}>
              {job.pendingPrompt && <AnsiLine text={job.pendingPrompt} />}
            </span>
            <input
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              style={{
                flex:1, background:"transparent", border:"none", outline:"none",
                color:"#e6edf3", fontFamily:"'JetBrains Mono',monospace", fontSize:12.5,
                caretColor: accent,
              }}
              placeholder="Type and press Enter…"
            />
            <button onClick={submit} style={{
              padding:"2px 10px", borderRadius:4,
              background: accent + "22", border:`1px solid ${accent}55`,
              color: accent, fontSize:11, cursor:"pointer",
            }}>Send ↵</button>
          </div>
        )}

        {job.status === "running" && !job.script.interactive && (
          <span style={{ color:"#374151", fontFamily:"monospace", fontSize:11 }}>[read-only stream]</span>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ─── BLINK DOT ────────────────────────────────────────────────────────────────
function Blink({ color }) {
  return <span style={{ width:7, height:7, borderRadius:"50%", background:color, display:"inline-block", animation:"fbsPulse 1.2s ease-in-out infinite" }} />;
}

// ─── JOB TAB ──────────────────────────────────────────────────────────────────
function JobTab({ job, active, onClick, onClose }) {
  const accent = CAT_ACCENT[job.script.category] || "#60a5fa";
  const isDone = job.status === "completed" || job.status === "killed";

  return (
    <div
      onClick={onClick}
      style={{
        display:"flex", alignItems:"center", gap:7, padding:"6px 12px 6px 10px",
        borderRadius:"6px 6px 0 0", cursor:"pointer", flexShrink:0, maxWidth:200, minWidth:120,
        background: active ? "#0d1117" : "#080c10",
        borderTop:    active ? `2px solid ${accent}` : "2px solid transparent",
        borderLeft:   active ? "1px solid #21262d" : "1px solid transparent",
        borderRight:  active ? "1px solid #21262d" : "1px solid transparent",
        borderBottom: active ? "1px solid #0d1117" : "1px solid transparent",
        position:"relative", zIndex: active ? 2 : 1,
        transition:"all 0.12s",
      }}
    >
      <span style={{ fontSize:13, flexShrink:0 }}>{job.script.icon}</span>
      <span style={{
        fontSize:11.5, color: active ? "#e6edf3" : "#6b7280",
        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1,
      }}>{job.script.label}</span>

      {/* Status indicator */}
      {(job.status === "running" || job.status === "waiting_input") && (
        <Blink color={job.status === "waiting_input" ? "#c084fc" : "#fbbf24"} />
      )}
      {job.status === "completed" && <span style={{ color:"#4ade80", fontSize:10 }}>✓</span>}
      {job.status === "error"     && <span style={{ color:"#f87171", fontSize:10 }}>✗</span>}

      {/* Close */}
      <span
        onClick={e => { e.stopPropagation(); onClose(job.id); }}
        style={{ fontSize:11, color:"#4b5563", marginLeft:2, lineHeight:1, cursor:"pointer", padding:"1px 2px", borderRadius:2 }}
      >✕</span>
    </div>
  );
}

// ─── SIDEBAR SCRIPT ITEM ──────────────────────────────────────────────────────
function SidebarItem({ script, onLaunch, runningCount }) {
  const [hov, setHov] = useState(false);
  const accent = CAT_ACCENT[script.category];
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:"flex", alignItems:"center", gap:9, padding:"8px 12px",
        borderRadius:6, cursor:"pointer", transition:"background 0.1s",
        background: hov ? "#161b22" : "transparent",
      }}
    >
      <span style={{ fontSize:15, flexShrink:0 }}>{script.icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12.5, color: hov ? "#e6edf3" : "#c9d1d9", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {script.label}
        </div>
        <div style={{ fontSize:10, color: script.interactive ? "#4ade8088" : "#4b5563", marginTop:1 }}>
          {script.interactive ? "interactive" : "view only"}
          {script.restricted && <span style={{ color:"#f8717188", marginLeft:5 }}>admin</span>}
        </div>
      </div>
      {runningCount > 0 && (
        <span style={{ fontSize:10, background:"#fbbf2422", color:"#fbbf24", borderRadius:10, padding:"1px 6px" }}>{runningCount}</span>
      )}
      <button
        onClick={() => onLaunch(script)}
        style={{
          padding:"3px 10px", borderRadius:4, border:`1px solid ${accent}55`,
          background: hov ? accent+"22" : "transparent",
          color: accent, fontSize:11, cursor:"pointer", fontWeight:500,
          opacity: hov ? 1 : 0, transition:"opacity 0.1s",
          flexShrink:0,
        }}
      >Run</button>
    </div>
  );
}

// ─── STATUS BAR ───────────────────────────────────────────────────────────────
function StatusBar({ jobs }) {
  const running  = jobs.filter(j => j.status === "running").length;
  const waiting  = jobs.filter(j => j.status === "waiting_input").length;
  const done     = jobs.filter(j => j.status === "completed").length;
  const errored  = jobs.filter(j => j.status === "error").length;

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:16, padding:"4px 16px",
      background:"#080c10", borderTop:"1px solid #161b22",
      fontSize:11, fontFamily:"'JetBrains Mono',monospace", flexShrink:0,
    }}>
      {running > 0  && <span style={{ color:"#fbbf24", display:"flex", alignItems:"center", gap:4 }}><Blink color="#fbbf24"/>{running} running</span>}
      {waiting > 0  && <span style={{ color:"#c084fc", display:"flex", alignItems:"center", gap:4 }}><Blink color="#c084fc"/>{waiting} awaiting input</span>}
      {done > 0     && <span style={{ color:"#4ade80" }}>✓ {done} completed</span>}
      {errored > 0  && <span style={{ color:"#f87171" }}>✗ {errored} errored</span>}
      {jobs.length === 0 && <span style={{ color:"#374151" }}>No active jobs</span>}
      <span style={{ marginLeft:"auto", color:"#374151" }}>FBS Platform v2</span>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [jobs,       setJobs]       = useState([]);  // all jobs (running + done)
  const [activeId,   setActiveId]   = useState(null);
  const [search,     setSearch]     = useState("");
  const [activeCategory, setActiveCat] = useState("All");
  const timersRef = useRef({});  // jobId -> [timeoutIds]

  // ── helpers ────────────────────────────────────────────────────────────────
  const updateJob = useCallback((id, patch) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...patch } : j));
  }, []);

  const appendLine = useCallback((id, line) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, lines: [...j.lines, line] } : j));
  }, []);

  // ── launch a script ───────────────────────────────────────────────────────
  const launch = useCallback((script) => {
    const job = createJob(script);
    setJobs(prev => [...prev, job]);
    setActiveId(job.id);

    const seq = SEQUENCES[script.key] || SEQUENCES["_default"];
    const ids = [];
    timersRef.current[job.id] = ids;

    seq.forEach(step => {
      const tid = setTimeout(() => {
        if (step.type === "prompt") {
          appendLine(job.id, { type: "stdout", data: step.data });
          updateJob(job.id, { status: "waiting_input", pendingPrompt: step.data });
        } else if (step.type === "exit") {
          updateJob(job.id, {
            status: step.data.code === 0 ? "completed" : "error",
            endedAt: Date.now(),
          });
        } else {
          appendLine(job.id, { type: step.type, data: step.data });
        }
      }, step.delay);
      ids.push(tid);
    });
  }, [appendLine, updateJob]);

  // ── user sends stdin ──────────────────────────────────────────────────────
  const handleInput = useCallback((jobId, value) => {
    appendLine(jobId, { type: "stdin", data: value + "\r\n" });
    updateJob(jobId, { status: "running", pendingPrompt: null });

    // simulate response
    const t1 = setTimeout(() => appendLine(jobId, { type:"stdout", data:`Processing "${value}"...\r\n` }), 400);
    const t2 = setTimeout(() => appendLine(jobId, { type:"stdout", data:"\x1b[32m✓ Done.\x1b[0m\r\n" }), 1200);
    const t3 = setTimeout(() => updateJob(jobId, { status:"completed", endedAt:Date.now() }), 1400);
    timersRef.current[jobId]?.push(t1, t2, t3);
  }, [appendLine, updateJob]);

  // ── kill a job ────────────────────────────────────────────────────────────
  const killJob = useCallback((jobId) => {
    (timersRef.current[jobId] || []).forEach(clearTimeout);
    appendLine(jobId, { type:"stderr", data:"\r\n[Process killed by user]\r\n" });
    updateJob(jobId, { status:"killed", endedAt:Date.now() });
  }, [appendLine, updateJob]);

  // ── close a tab ───────────────────────────────────────────────────────────
  const closeTab = useCallback((jobId) => {
    killJob(jobId);
    setJobs(prev => {
      const remaining = prev.filter(j => j.id !== jobId);
      if (activeId === jobId) setActiveId(remaining.length ? remaining[remaining.length-1].id : null);
      return remaining;
    });
  }, [killJob, activeId]);

  // ── filtered sidebar ──────────────────────────────────────────────────────
  const filtered = SCRIPTS.filter(s => {
    const matchCat = activeCategory === "All" || s.category === activeCategory;
    const matchQ   = s.label.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = filtered.filter(s => s.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  const runningByKey = jobs.reduce((acc, j) => {
    if (j.status === "running" || j.status === "waiting_input") {
      acc[j.script.key] = (acc[j.script.key] || 0) + 1;
    }
    return acc;
  }, {});

  const activeJob = jobs.find(j => j.id === activeId) || null;
  const pendingCount = jobs.filter(j => j.status === "waiting_input").length;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"#010409", color:"#e6edf3", fontFamily:"'Geist','SF Pro Display',system-ui,sans-serif", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;height:3px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#21262d;border-radius:2px;}
        @keyframes fbsPulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.5;transform:scale(0.85);}}
        @keyframes fbsSlideIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
        button:hover{opacity:0.85;}
      `}</style>

      {/* ── TOP CHROME ─────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"0 16px", background:"#080c10", borderBottom:"1px solid #161b22", flexShrink:0, height:44 }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginRight:8 }}>
          <div style={{ width:26, height:26, borderRadius:6, background:"linear-gradient(135deg,#1e3a5f,#2d6a4a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>⚡</div>
          <span style={{ fontWeight:700, fontSize:14, letterSpacing:"-0.3px" }}>FBS</span>
          <span style={{ fontSize:12, color:"#374151" }}>Platform</span>
        </div>

        {/* Job tabs */}
        <div style={{ display:"flex", alignItems:"flex-end", gap:2, flex:1, overflowX:"auto", paddingBottom:0, alignSelf:"flex-end" }}>
          {jobs.map(job => (
            <JobTab
              key={job.id}
              job={job}
              active={job.id === activeId}
              onClick={() => setActiveId(job.id)}
              onClose={closeTab}
            />
          ))}
          {jobs.length === 0 && (
            <span style={{ color:"#374151", fontSize:11, fontFamily:"monospace", paddingBottom:8, paddingLeft:4 }}>
              No running jobs — launch one from the sidebar
            </span>
          )}
        </div>

        {/* Attention badge */}
        {pendingCount > 0 && (
          <div style={{
            display:"flex", alignItems:"center", gap:6, padding:"4px 12px",
            borderRadius:20, background:"#4b215a", border:"1px solid #c084fc55",
            animation:"fbsSlideIn 0.3s ease", flexShrink:0,
          }}>
            <Blink color="#c084fc" />
            <span style={{ fontSize:11, color:"#c084fc", whiteSpace:"nowrap" }}>
              {pendingCount} job{pendingCount>1?"s":""} need{pendingCount===1?"s":""} input
            </span>
          </div>
        )}
      </div>

      {/* ── MAIN BODY ──────────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* ── LEFT SIDEBAR ───────────────────────────────────────────────── */}
        <div style={{ width:264, display:"flex", flexDirection:"column", background:"#0d1117", borderRight:"1px solid #161b22", flexShrink:0, overflow:"hidden" }}>
          <div style={{ padding:"12px 12px 8px" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tools…"
              style={{
                width:"100%", padding:"6px 10px", background:"#161b22",
                border:"1px solid #21262d", borderRadius:5,
                color:"#e6edf3", fontSize:12, outline:"none",
                fontFamily:"'JetBrains Mono',monospace",
              }}
            />
          </div>

          {/* Category pills */}
          <div style={{ padding:"0 10px 8px", display:"flex", flexWrap:"wrap", gap:3 }}>
            {["All",...CATEGORIES].map(cat => (
              <button key={cat} onClick={() => setActiveCat(cat)}
                style={{
                  padding:"2px 8px", borderRadius:4, border:"none", cursor:"pointer", fontSize:10,
                  background: activeCategory===cat ? "#21262d" : "transparent",
                  color: activeCategory===cat
                    ? (cat==="All" ? "#e6edf3" : CAT_ACCENT[cat])
                    : "#4b5563",
                }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Script list */}
          <div style={{ flex:1, overflowY:"auto", padding:"0 4px 12px" }}>
            {Object.entries(grouped).map(([cat, scripts]) => (
              <div key={cat}>
                <div style={{ padding:"8px 12px 3px", fontSize:9.5, fontWeight:600, color:CAT_ACCENT[cat], textTransform:"uppercase", letterSpacing:"0.1em" }}>
                  {cat}
                </div>
                {scripts.map(s => (
                  <SidebarItem key={s.key} script={s} onLaunch={launch} runningCount={runningByKey[s.key]||0} />
                ))}
              </div>
            ))}
          </div>

          {/* Active jobs quick-jump */}
          {jobs.filter(j => j.status==="running"||j.status==="waiting_input").length > 0 && (
            <div style={{ borderTop:"1px solid #161b22", padding:"8px 12px" }}>
              <div style={{ fontSize:9.5, color:"#374151", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:5 }}>Active Jobs</div>
              {jobs.filter(j=>j.status==="running"||j.status==="waiting_input").map(j => (
                <div key={j.id} onClick={() => setActiveId(j.id)}
                  style={{
                    display:"flex", alignItems:"center", gap:7, padding:"4px 4px",
                    borderRadius:5, cursor:"pointer", marginBottom:1,
                    background: activeId===j.id ? "#161b22" : "transparent",
                  }}>
                  <span style={{ fontSize:12 }}>{j.script.icon}</span>
                  <span style={{ fontSize:11, color:"#8b949e", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{j.script.label}</span>
                  {j.status==="waiting_input"
                    ? <Blink color="#c084fc"/>
                    : <Blink color="#fbbf24"/>
                  }
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: TERMINAL ────────────────────────────────────────────── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", animation:"fbsSlideIn 0.2s ease" }}>
          {jobs.length === 0 ? (
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20, padding:40 }}>
              <div style={{ fontSize:48 }}>⚡</div>
              <div style={{ fontSize:20, fontWeight:600 }}>FBS Booklet Platform</div>
              <div style={{ fontSize:13, color:"#4b5563", textAlign:"center", maxWidth:380, lineHeight:1.7 }}>
                Launch multiple tools simultaneously. Each runs in its own tab — switch between them freely, provide inputs when prompted, and monitor everything in real time.
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginTop:8 }}>
                {SCRIPTS.filter(s=>["assemble-condensed","checkin-bpl","view-error-log","list-file-revision","assemble-print-pdf","view-custom-log"].includes(s.key)).map(s => (
                  <button key={s.key} onClick={() => launch(s)}
                    style={{
                      padding:"10px 14px", borderRadius:7, cursor:"pointer", textAlign:"left",
                      background:"#0d1117", border:`1px solid ${CAT_ACCENT[s.category]}33`,
                      color:"#c9d1d9", fontSize:12,
                      transition:"all 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = CAT_ACCENT[s.category]+"99"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = CAT_ACCENT[s.category]+"33"}
                  >
                    <div style={{ fontSize:18, marginBottom:5 }}>{s.icon}</div>
                    <div style={{ fontWeight:500 }}>{s.label}</div>
                    <div style={{ fontSize:10, color:CAT_ACCENT[s.category], marginTop:3 }}>{s.category}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <TerminalPanel job={activeJob} onInput={handleInput} onKill={killJob} />
          )}
        </div>
      </div>

      {/* ── STATUS BAR ─────────────────────────────────────────────────────── */}
      <StatusBar jobs={jobs} />
    </div>
  );
}
