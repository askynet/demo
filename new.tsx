import { useState, useMemo, useRef, useEffect } from "react";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const SCRIPTS = [
  { key:"assemble-pdf",            label:"Assemble PDF",                  category:"Assembly",        interactive:true,  icon:"📚", color:"#ef4444", bg:"#fef2f2" },
  { key:"assemble-condensed",      label:"Assemble Condensed",             category:"Assembly",        interactive:true,  icon:"📋", color:"#f97316", bg:"#fff7ed" },
  { key:"checkin-bpl",             label:"Check In BPL",                   category:"Version Control", interactive:true,  icon:"⬆️", color:"#22c55e", bg:"#f0fdf4" },
  { key:"checkout-bpl",            label:"Check Out BPL",                  category:"Version Control", interactive:true,  icon:"⬇️", color:"#3b82f6", bg:"#eff6ff" },
  { key:"retrieve-blocks",         label:"Retrieve Blocks",                category:"Editing",         interactive:true,  icon:"📥", color:"#3b82f6", bg:"#eff6ff" },
  { key:"revision-info",           label:"Revision Info",                  category:"Version Control", interactive:false, icon:"📄", color:"#f59e0b", bg:"#fffbeb" },
  { key:"remove-revision",         label:"Remove Revision",                category:"Version Control", interactive:false, icon:"🗑️", color:"#ef4444", bg:"#fef2f2" },
  { key:"shell-tool",              label:"Shell Tool",                     category:"Utilities",       interactive:true,  icon:"⚙️", color:"#6b7280", bg:"#f9fafb", restricted:true },
  { key:"list-files",              label:"List Files",                     category:"Utilities",       interactive:false, icon:"📑", color:"#8b5cf6", bg:"#f5f3ff" },
  { key:"utilities",               label:"Utilities",                      category:"Utilities",       interactive:true,  icon:"🔧", color:"#14b8a6", bg:"#f0fdfa" },
  { key:"checkout-revision-edit",  label:"Check Out Revision (Edit)",      category:"Version Control", interactive:true,  icon:"✏️", color:"#6366f1", bg:"#eef2ff" },
  { key:"checkout-revision-view",  label:"Check Out Revision (View)",      category:"Version Control", interactive:false, icon:"👁️", color:"#0ea5e9", bg:"#f0f9ff" },
  { key:"checkin-docid",           label:"Check In Docid",                 category:"Version Control", interactive:true,  icon:"✅", color:"#22c55e", bg:"#f0fdf4" },
  { key:"checkout-docid",          label:"Check Out Docid",                category:"Version Control", interactive:true,  icon:"📂", color:"#3b82f6", bg:"#eff6ff" },
  { key:"crisp",                   label:"Crisp Editor",                   category:"Editing",         interactive:true,  icon:"✍️", color:"#a855f7", bg:"#faf5ff" },
  { key:"insert-customs",          label:"Insert Customs",                  category:"Editing",         interactive:true,  icon:"🔧", color:"#f97316", bg:"#fff7ed" },
  { key:"insert-standard-blocks",  label:"Insert Standard Blocks",         category:"Editing",         interactive:true,  icon:"🧱", color:"#84cc16", bg:"#f7fee7" },
  { key:"move-id",                 label:"Move Id",                        category:"Utilities",       interactive:true,  icon:"🔀", color:"#ec4899", bg:"#fdf2f8" },
  { key:"copy-key",                label:"Password-less Auth",             category:"Utilities",       interactive:true,  icon:"🔑", color:"#f59e0b", bg:"#fffbeb" },
  { key:"view-error-log",          label:"View Assembly Error File",       category:"Logs",            interactive:false, icon:"⚠️", color:"#ef4444", bg:"#fef2f2" },
  { key:"view-custom-log",         label:"View Custom Insert Log",         category:"Logs",            interactive:false, icon:"📄", color:"#6b7280", bg:"#f9fafb" },
];

const CATEGORIES = ["Assembly","Version Control","Editing","Utilities","Logs"];

const JOBS_MOCK = [
  { id:1, key:"assemble-pdf",     label:"Assemble PDF",     status:"running",       time:"10:21:34 AM" },
  { id:2, key:"retrieve-blocks",  label:"Retrieve Blocks",  status:"running",       time:"10:22:11 AM" },
  { id:3, key:"shell-tool",       label:"Shell Tool",       status:"running",       time:"10:23:02 AM" },
  { id:4, key:"checkout-bpl",     label:"Check Out BPL",    status:"running",       time:"10:23:18 AM" },
  { id:5, key:"checkin-bpl",      label:"Check In BPL",     status:"waiting_input", time:"10:23:44 AM" },
  { id:6, key:"list-files",       label:"List File Revision Info", status:"queued", time:"10:24:01 AM" },
];

const ATTENTION_MOCK = [
  { id:1, key:"checkin-bpl",     label:"Check In BPL",     reason:"Waiting for filename",  status:"waiting", time:"10:23:44 AM" },
  { id:2, key:"remove-revision", label:"Remove Revision",  reason:"Failed",                status:"failed",  time:"10:22:31 AM" },
  { id:3, key:"revision-info",   label:"Revision Info",    reason:"Permission denied",     status:"failed",  time:"10:20:11 AM" },
];

const WORKSPACE_MOCK = [
  {
    id:1, key:"assemble-pdf", label:"Assemble PDF", status:"running",
    subtitle:"Generating booklet content...",
    logs:[
      { time:"10:21:34", ok:true,  text:"Connected to Linux Server 01" },
      { time:"10:21:42", ok:true,  text:"BPL source loaded successfully" },
      { time:"10:21:51", ok:true,  text:"Variables generated (165 items)" },
      { time:"10:22:03", ok:null,  text:"Assembling content..." },
    ],
  },
  {
    id:2, key:"retrieve-blocks", label:"Retrieve Blocks", status:"running",
    subtitle:"Retrieving textblocks...",
    logs:[
      { time:"10:22:11", ok:true,  text:"Connected to Linux Server 01" },
      { time:"10:22:18", ok:true,  text:"Reading revision list" },
      { time:"10:22:28", ok:true,  text:"Retrieving textblocks..." },
      { time:"10:22:33", ok:null,  text:"Processing data..." },
    ],
  },
  {
    id:3, key:"checkin-bpl", label:"Check In BPL", status:"waiting_input",
    subtitle:"Please provide filename to continue",
    inputLabel:"Filename",
    inputPlaceholder:"Enter filename (e.g., DOC-2026-0001)",
    requestedBy:"John Doe",
    logs:[],
  },
  {
    id:4, key:"shell-tool", label:"Shell Tool", status:"running",
    subtitle:"Executing commands...",
    logs:[
      { time:"10:23:02", ok:true,  text:"Connected to Linux Server 01" },
      { time:"10:23:05", ok:true,  text:"Command prepared" },
      { time:"10:23:06", ok:null,  text:"Executing..." },
    ],
  },
];

const STATS = [
  { label:"Running",   value:12, color:"#22c55e",  icon:"▶",  borderColor:"#bbf7d0" },
  { label:"Waiting",   value:3,  color:"#a855f7",  icon:"⏸",  borderColor:"#e9d5ff" },
  { label:"Completed", value:28, color:"#3b82f6",  icon:"✓",  borderColor:"#bfdbfe" },
  { label:"Failed",    value:2,  color:"#ef4444",  icon:"⚠",  borderColor:"#fecaca" },
];

const FAVORITES_DEFAULT = ["assemble-pdf","checkin-bpl","retrieve-blocks","revision-info","shell-tool"];

// ─── THEME ────────────────────────────────────────────────────────────────────

function useTheme(mode) {
  const dark = mode === "dark";
  return {
    dark,
    bg:       dark ? "#0f1623" : "#f0f4f8",
    surface:  dark ? "#161e2e" : "#ffffff",
    surface2: dark ? "#1c2640" : "#f8fafc",
    surface3: dark ? "#1e2d47" : "#f1f5f9",
    border:   dark ? "#243049" : "#e2e8f0",
    border2:  dark ? "#2d3f60" : "#cbd5e1",
    text:     dark ? "#e2eaf6" : "#0f172a",
    text2:    dark ? "#8fa3c0" : "#475569",
    text3:    dark ? "#4a6080" : "#94a3b8",
    accent:   "#1d4ed8",
    accentBg: dark ? "#1e3a8a22" : "#eff6ff",
    shadow:   dark ? "0 2px 16px #00000055" : "0 2px 16px #0000000f",
    shadow2:  dark ? "0 8px 40px #00000088" : "0 8px 40px #0000001a",
  };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function ScriptIcon({ script, size = 32, t }) {
  const bg = t.dark
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

function StatusDot({ status }) {
  const map = {
    running:       { color:"#22c55e", label:"Running",       pulse: true },
    waiting_input: { color:"#a855f7", label:"Waiting Input", pulse: true },
    queued:        { color:"#f59e0b", label:"Queued",        pulse: false },
    failed:        { color:"#ef4444", label:"Failed",        pulse: false },
    completed:     { color:"#3b82f6", label:"Completed",     pulse: false },
  };
  const s = map[status] || { color:"#94a3b8", label:status };
  return (
    <span style={{ display:"flex", alignItems:"center", gap:5 }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: s.color, flexShrink: 0,
        boxShadow: s.pulse ? `0 0 0 2px ${s.color}44` : "none",
        animation: s.pulse ? "dotPulse 1.8s ease-in-out infinite" : "none",
      }}/>
    </span>
  );
}

function StatusPill({ status, t }) {
  const map = {
    running:       { color:"#22c55e", bg:"#f0fdf4", darkBg:"#14532d44", border:"#bbf7d0", label:"RUNNING" },
    waiting_input: { color:"#a855f7", bg:"#faf5ff", darkBg:"#4c1d9544", border:"#e9d5ff", label:"WAITING INPUT" },
    queued:        { color:"#f59e0b", bg:"#fffbeb", darkBg:"#78350f44", border:"#fde68a", label:"QUEUED" },
    failed:        { color:"#ef4444", bg:"#fef2f2", darkBg:"#7f1d1d44", border:"#fecaca", label:"FAILED" },
    completed:     { color:"#3b82f6", bg:"#eff6ff", darkBg:"#1e3a8a44", border:"#bfdbfe", label:"COMPLETED" },
  };
  const s = map[status] || { color:"#94a3b8", bg:"#f9fafb", label: status.toUpperCase() };
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

function Divider({ t }) {
  return <div style={{ height: 1, background: t.border, margin: "0" }} />;
}

// ─── WORKSPACE CARD ───────────────────────────────────────────────────────────

function WorkspaceCard({ ws, t, onInput }) {
  const script = SCRIPTS.find(s => s.key === ws.key) || { icon:"📄", color:"#6b7280", bg:"#f9fafb", label:ws.label };
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    if (!input.trim()) return;
    setSubmitted(true);
    onInput?.(ws.id, input);
  };

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
        display:"flex", alignItems:"center", gap:10,
        padding:"12px 14px 10px",
        borderBottom:`1px solid ${t.border}`,
      }}>
        <ScriptIcon script={script} size={34} t={t}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:15, color:t.text, letterSpacing:"-0.2px" }}>
            {ws.label}
          </div>
          <div style={{
            fontSize:12,
            color: ws.status==="waiting_input" ? "#a855f7"
                 : ws.status==="failed" ? "#ef4444"
                 : t.text2,
            marginTop:1,
          }}>
            {ws.subtitle}
          </div>
        </div>
        <StatusPill status={ws.status} t={t}/>
        <button style={{ background:"none", border:"none", cursor:"pointer", color:t.text3, fontSize:14, padding:"2px 4px" }}>⤢</button>
        <button style={{ background:"none", border:"none", cursor:"pointer", color:t.text3, fontSize:14, padding:"2px 4px" }}>⋯</button>
        <button style={{ background:"none", border:"none", cursor:"pointer", color:t.text3, fontSize:16, padding:"2px 4px" }}>✕</button>
      </div>

      {/* Log lines */}
      {ws.logs.length > 0 && (
        <div style={{ padding:"10px 14px 6px", background: t.dark ? "#0d1424" : "#fafbff" }}>
          {ws.logs.map((l,i) => (
            <div key={i} style={{
              display:"flex", alignItems:"flex-start", gap:8,
              padding:"2px 0",
              fontFamily:"'IBM Plex Mono',monospace", fontSize:11.5,
              color: t.text2,
            }}>
              <span style={{ color:t.text3, flexShrink:0, width:52 }}>{l.time}</span>
              <span style={{
                width:14, height:14, borderRadius:"50%", flexShrink:0, marginTop:1,
                background: l.ok === true ? "#22c55e22" : l.ok === false ? "#ef444422" : "#f59e0b22",
                border: `1px solid ${l.ok === true ? "#22c55e" : l.ok === false ? "#ef4444" : "#f59e0b"}55`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:8, color: l.ok === true ? "#22c55e" : l.ok === false ? "#ef4444" : "#f59e0b",
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
        <div style={{ padding:"10px 14px 12px", background: t.dark ? "#130e1e" : "#fdf5ff" }}>
          <div style={{ fontSize:11, fontWeight:600, color:t.text3, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6 }}>
            {ws.inputLabel}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==="Enter" && submit()}
              placeholder={ws.inputPlaceholder}
              style={{
                flex:1, padding:"8px 12px",
                background: t.surface,
                border: `1.5px solid #a855f766`,
                borderRadius:7, fontSize:13, color:t.text,
                outline:"none", fontFamily:"inherit",
              }}
            />
            <button onClick={submit} style={{
              padding:"8px 18px", borderRadius:7, border:"none",
              background:"#7c3aed", color:"#fff",
              fontWeight:600, fontSize:13, cursor:"pointer",
            }}>Submit</button>
          </div>
          {ws.requestedBy && (
            <div style={{ fontSize:11, color:t.text3, marginTop:6 }}>
              Requested by: {ws.requestedBy}
            </div>
          )}
        </div>
      )}

      {submitted && (
        <div style={{ padding:"10px 14px", background:"#14532d22", fontSize:12, color:"#22c55e" }}>
          ✓ Input submitted. Processing...
        </div>
      )}

      {/* Footer actions */}
      <div style={{
        display:"flex", alignItems:"center", gap:14, padding:"8px 14px",
        borderTop:`1px solid ${t.border}`,
      }}>
        {ws.status !== "waiting_input" && (
          <button style={{
            display:"flex", alignItems:"center", gap:5,
            background:"none", border:"none", cursor:"pointer",
            color:"#ef4444", fontSize:12, fontWeight:500, padding:0,
          }}>
            <span style={{
              width:14, height:14, borderRadius:2,
              border:"2px solid #ef4444",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:8,
            }}>■</span>
            Stop
          </button>
        )}
        <button style={{
          background:"none", border:"none", cursor:"pointer",
          color:t.text2, fontSize:12, fontWeight:500, padding:0,
        }}>View Output</button>
        <div style={{ flex:1 }}/>
        {ws.status !== "waiting_input" && (
          <button style={{
            display:"flex", alignItems:"center", gap:4,
            background:"none", border:"none", cursor:"pointer",
            color:t.text2, fontSize:12, fontWeight:500, padding:0,
          }}>
            Open <span style={{ fontSize:10 }}>⤢</span>
          </button>
        )}
        {ws.status === "waiting_input" && (
          <button style={{
            background:"none", border:"none", cursor:"pointer",
            color:"#7c3aed", fontSize:12, fontWeight:500, padding:0,
          }}>View Details</button>
        )}
      </div>
    </div>
  );
}

// ─── LAUNCH DIALOG ────────────────────────────────────────────────────────────

function LaunchDialog({ t, onClose, onLaunch }) {
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState(null);
  const [activeCat, setActiveCat] = useState("All");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const filtered = useMemo(() => SCRIPTS.filter(s => {
    const mc = activeCat === "All" || s.category === activeCat;
    const mt = s.label.toLowerCase().includes(search.toLowerCase());
    return mc && mt;
  }), [search, activeCat]);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1000,
      background:"#00000066", backdropFilter:"blur(4px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      animation:"fadeIn 0.15s ease",
    }}>
      <div ref={ref} style={{
        width:560, maxHeight:"80vh",
        background: t.surface,
        borderRadius:14, overflow:"hidden",
        boxShadow: t.shadow2,
        border:`1px solid ${t.border2}`,
        display:"flex", flexDirection:"column",
        animation:"slideUp 0.2s ease",
      }}>
        {/* Dialog header */}
        <div style={{
          padding:"16px 18px 12px",
          borderBottom:`1px solid ${t.border}`,
          display:"flex", alignItems:"center", gap:10,
        }}>
          <div style={{
            width:32, height:32, borderRadius:8,
            background:"linear-gradient(135deg,#1d4ed8,#7c3aed)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:15,
          }}>⚡</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:15, color:t.text }}>Launch Script</div>
            <div style={{ fontSize:11, color:t.text3 }}>Select a script to run</div>
          </div>
          <button onClick={onClose} style={{
            background:"none", border:"none", cursor:"pointer",
            color:t.text3, fontSize:18, lineHeight:1,
          }}>✕</button>
        </div>

        {/* Search */}
        <div style={{ padding:"10px 14px 6px" }}>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:t.text3, fontSize:13 }}>🔍</span>
            <input
              autoFocus value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search scripts..."
              style={{
                width:"100%", padding:"8px 12px 8px 32px",
                background:t.surface2, border:`1px solid ${t.border2}`,
                borderRadius:7, color:t.text, fontSize:13, outline:"none",
                fontFamily:"inherit",
              }}
            />
          </div>
        </div>

        {/* Category pills */}
        <div style={{ display:"flex", gap:4, padding:"4px 14px 8px", overflowX:"auto", scrollbarWidth:"none" }}>
          {["All",...CATEGORIES].map(cat => (
            <button key={cat} onClick={()=>setActiveCat(cat)} style={{
              padding:"3px 10px", borderRadius:20, border:`1px solid ${activeCat===cat ? "#1d4ed8" : t.border}`,
              background: activeCat===cat ? (t.dark?"#1e3a8a33":"#eff6ff") : "transparent",
              color: activeCat===cat ? "#3b82f6" : t.text3,
              fontSize:11, cursor:"pointer", whiteSpace:"nowrap",
              fontWeight: activeCat===cat ? 600 : 400,
            }}>{cat}</button>
          ))}
        </div>

        <Divider t={t}/>

        {/* Script list */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {filtered.map(s => (
            <div key={s.key}
              onClick={() => setSelected(s.key)}
              style={{
                display:"flex", alignItems:"center", gap:10, padding:"10px 16px",
                cursor:"pointer",
                background: selected===s.key ? (t.dark?"#1e3a8a22":"#eff6ff") : "transparent",
                borderLeft: selected===s.key ? "3px solid #3b82f6" : "3px solid transparent",
                transition:"all 0.1s",
              }}
              onMouseEnter={e=>{ if(selected!==s.key) e.currentTarget.style.background=t.surface2; }}
              onMouseLeave={e=>{ if(selected!==s.key) e.currentTarget.style.background="transparent"; }}
            >
              <ScriptIcon script={s} size={32} t={t}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:500, color:t.text }}>{s.label}</div>
                <div style={{ display:"flex", gap:6, marginTop:2 }}>
                  <span style={{ fontSize:10, color: s.color }}>{s.category}</span>
                  <span style={{ fontSize:10, color:t.text3 }}>·</span>
                  <span style={{ fontSize:10, color: s.interactive?"#22c55e":t.text3 }}>
                    {s.interactive?"interactive":"view only"}
                  </span>
                  {s.restricted && <span style={{ fontSize:10, color:"#ef4444", background:"#ef444422", border:"1px solid #ef444433", borderRadius:3, padding:"0 4px" }}>admin</span>}
                </div>
              </div>
              {selected===s.key && <span style={{ color:"#3b82f6", fontSize:14 }}>✓</span>}
            </div>
          ))}
        </div>

        <Divider t={t}/>

        {/* Footer */}
        <div style={{ padding:"12px 16px", display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{
            padding:"8px 18px", borderRadius:7,
            border:`1px solid ${t.border2}`, background:"transparent",
            color:t.text2, fontSize:13, cursor:"pointer",
          }}>Cancel</button>
          <button
            onClick={()=>{ if(selected){ onLaunch(selected); onClose(); } }}
            disabled={!selected}
            style={{
              padding:"8px 20px", borderRadius:7, border:"none",
              background: selected ? "#1d4ed8" : t.border,
              color: selected ? "#fff" : t.text3,
              fontSize:13, fontWeight:600, cursor: selected ? "pointer" : "default",
              transition:"all 0.15s",
            }}
          >▶ Launch</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function FBSPlatform() {
  const [themeMode, setThemeMode] = useState("light");
  const t = useTheme(themeMode);
  const [favorites, setFavorites] = useState(new Set(FAVORITES_DEFAULT));
  const [showLaunch, setShowLaunch] = useState(false);
  const [search, setSearch] = useState("");
  const [workspaces, setWorkspaces] = useState(WORKSPACE_MOCK);
  const [gridCols, setGridCols] = useState(2); // 1 or 2
  const [hoveredFav, setHoveredFav] = useState(null);

  const toggleFav = (key) => {
    setFavorites(prev => { const n=new Set(prev); n.has(key)?n.delete(key):n.add(key); return n; });
  };

  const favScripts = SCRIPTS.filter(s => favorites.has(s.key));
  const filteredScripts = SCRIPTS.filter(s => s.label.toLowerCase().includes(search.toLowerCase()));

  const handleInput = (id, val) => {
    setWorkspaces(prev => prev.map(w => w.id===id ? {...w, status:"running", subtitle:"Processing input..."} : w));
  };

  return (
    <div style={{
      display:"flex", flexDirection:"column", height:"100vh",
      background:t.bg, color:t.text,
      fontFamily:"'IBM Plex Sans','Geist',system-ui,sans-serif",
      overflow:"hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:${t.border2};border-radius:2px;}
        input::placeholder{color:${t.text3};}
        button{font-family:'IBM Plex Sans',system-ui,sans-serif;}
        @keyframes dotPulse{0%,100%{box-shadow:0 0 0 0 currentColor33;}50%{box-shadow:0 0 0 4px transparent;}}
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
        @keyframes slideUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pulse2{0%,100%{opacity:1;}50%{opacity:0.5;}}
      `}</style>

      {/* ═══ HEADER ═══ */}
      <header style={{
        height:60, flexShrink:0,
        background:t.surface,
        borderBottom:`1px solid ${t.border}`,
        display:"flex", alignItems:"center",
        padding:"0 24px", gap:0,
        boxShadow:`0 1px 0 ${t.border}`,
      }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginRight:28, flexShrink:0 }}>
          <div style={{
            background:"#1d4ed8", borderRadius:8, padding:"4px 8px",
            fontWeight:800, fontSize:18, color:"#fff", letterSpacing:"-0.5px",
            lineHeight:1,
          }}>FBS</div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", color:t.text2, lineHeight:1 }}>BOOKLET</div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", color:t.text2, lineHeight:1 }}>PLATFORM</div>
          </div>
        </div>

        {/* Vertical divider */}
        <div style={{ width:1, height:32, background:t.border, marginRight:24 }}/>

        {/* Stats */}
        <div style={{ display:"flex", gap:0, flex:1 }}>
          {STATS.map((s,i) => (
            <div key={s.label} style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"0 24px",
              borderRight: i<STATS.length-1 ? `1px solid ${t.border}` : "none",
            }}>
              <div style={{
                width:34, height:34, borderRadius:"50%",
                border:`2px solid ${s.borderColor}`,
                background: t.dark ? s.color+"22" : s.color+"11",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:14, color:s.color, fontWeight:700,
              }}>{s.icon}</div>
              <div>
                <div style={{ fontSize:11, color:t.text2, fontWeight:500 }}>{s.label}</div>
                <div style={{ fontSize:22, fontWeight:800, color:t.text, lineHeight:1.1, letterSpacing:"-0.5px" }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          {/* Theme toggle */}
          <button onClick={()=>setThemeMode(m=>m==="dark"?"light":"dark")} style={{
            width:36, height:36, borderRadius:8,
            border:`1px solid ${t.border2}`, background:t.surface2,
            cursor:"pointer", fontSize:16,
            display:"flex", alignItems:"center", justifyContent:"center",
          }} title="Toggle theme">
            {t.dark ? "☀️" : "🌙"}
          </button>

          {/* Notification */}
          <div style={{ position:"relative" }}>
            <button style={{
              width:36, height:36, borderRadius:8,
              border:`1px solid ${t.border2}`, background:t.surface2,
              cursor:"pointer", fontSize:16,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>🔔</button>
            <span style={{
              position:"absolute", top:-4, right:-4,
              width:16, height:16, borderRadius:"50%",
              background:"#ef4444", color:"#fff",
              fontSize:9, fontWeight:700,
              display:"flex", alignItems:"center", justifyContent:"center",
              border:`2px solid ${t.surface}`,
            }}>3</span>
          </div>

          {/* User */}
          <div style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"4px 8px", borderRadius:8 }}
            onMouseEnter={e=>e.currentTarget.style.background=t.surface2}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{
              width:34, height:34, borderRadius:"50%",
              background:"linear-gradient(135deg,#1d4ed8,#7c3aed)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:13, color:"#fff", fontWeight:700,
            }}>JD</div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:t.text, lineHeight:1.2 }}>John Doe</div>
              <div style={{ fontSize:10, color:t.text3 }}>Administrator</div>
            </div>
            <span style={{ fontSize:10, color:t.text3 }}>▾</span>
          </div>
        </div>
      </header>

      {/* ═══ BODY ═══ */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* ═══ SIDEBAR ═══ */}
        <aside style={{
          width:248, flexShrink:0,
          background:t.surface,
          borderRight:`1px solid ${t.border}`,
          display:"flex", flexDirection:"column",
          overflow:"hidden",
        }}>
          {/* Launch button */}
          <div style={{ padding:"14px 12px 10px" }}>
            <button onClick={()=>setShowLaunch(true)} style={{
              width:"100%", padding:"10px 0",
              background:"#1d4ed8",
              border:"none", borderRadius:8,
              color:"#fff", fontSize:13, fontWeight:700,
              cursor:"pointer", display:"flex", alignItems:"center",
              justifyContent:"center", gap:7,
              boxShadow:"0 2px 12px #1d4ed844",
              transition:"background 0.15s",
            }}
            onMouseEnter={e=>e.currentTarget.style.background="#1e40af"}
            onMouseLeave={e=>e.currentTarget.style.background="#1d4ed8"}>
              <span style={{ fontSize:16 }}>+</span> Launch Script
            </button>
          </div>

          <div style={{ flex:1, overflowY:"auto" }}>
            {/* Favorites */}
            <div style={{ padding:"4px 14px 6px" }}>
              <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:t.text3, marginBottom:6 }}>
                Favorites
              </div>
              {favScripts.map(s => (
                <div key={s.key}
                  onMouseEnter={()=>setHoveredFav(s.key)}
                  onMouseLeave={()=>setHoveredFav(null)}
                  style={{
                    display:"flex", alignItems:"center", gap:8,
                    padding:"6px 6px", borderRadius:6, cursor:"pointer",
                    background: hoveredFav===s.key ? t.surface2 : "transparent",
                    transition:"background 0.1s",
                  }}
                >
                  <ScriptIcon script={s} size={22} t={t}/>
                  <span style={{ flex:1, fontSize:12.5, color:t.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {s.label}
                  </span>
                  <button onClick={e=>{e.stopPropagation();toggleFav(s.key);}} style={{
                    background:"none", border:"none", cursor:"pointer",
                    color:"#f59e0b", fontSize:14, opacity: hoveredFav===s.key?1:1,
                    padding:"0 2px", lineHeight:1,
                  }}>★</button>
                </div>
              ))}
            </div>

            <Divider t={t}/>

            {/* Search */}
            <div style={{ padding:"10px 12px 6px" }}>
              <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:t.text3, marginBottom:6 }}>
                Search
              </div>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", fontSize:12, color:t.text3 }}>🔍</span>
                <input
                  value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search scripts..."
                  style={{
                    width:"100%", padding:"6px 8px 6px 26px",
                    background:t.surface2, border:`1px solid ${t.border}`,
                    borderRadius:6, color:t.text, fontSize:12, outline:"none",
                  }}
                />
              </div>
            </div>

            {/* All Scripts */}
            <div style={{ padding:"6px 14px 4px" }}>
              <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:t.text3, marginBottom:6 }}>
                All Scripts
              </div>
              {filteredScripts.map(s => (
                <div key={s.key}
                  style={{
                    display:"flex", alignItems:"center", gap:8,
                    padding:"5px 4px", borderRadius:6, cursor:"pointer",
                    transition:"background 0.1s",
                  }}
                  onMouseEnter={e=>e.currentTarget.style.background=t.surface2}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                >
                  <ScriptIcon script={s} size={22} t={t}/>
                  <span style={{ flex:1, fontSize:12, color:t.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {s.label}
                  </span>
                  <button onClick={e=>{e.stopPropagation();toggleFav(s.key);}} style={{
                    background:"none", border:"none", cursor:"pointer",
                    fontSize:13, padding:"0 2px", lineHeight:1,
                    color: favorites.has(s.key) ? "#f59e0b" : t.text3,
                  }}>
                    {favorites.has(s.key) ? "★" : "☆"}
                  </button>
                </div>
              ))}
            </div>

            {/* Show More */}
            <div style={{ padding:"6px 14px 12px" }}>
              <button style={{
                background:"none", border:"none", cursor:"pointer",
                fontSize:12, color:t.text2, display:"flex", alignItems:"center", gap:4,
              }}>
                Show More <span>▾</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ═══ MAIN CONTENT ═══ */}
        <main style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
          <div style={{ flex:1, overflow:"auto", padding:20, display:"flex", flexDirection:"column", gap:16 }}>

            {/* Top row: Job Queue + Attention Center */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, flexShrink:0 }}>

              {/* Job Queue */}
              <div style={{
                background:t.surface, borderRadius:10,
                border:`1px solid ${t.border}`, overflow:"hidden",
                boxShadow:t.shadow,
              }}>
                <div style={{ display:"flex", alignItems:"center", padding:"12px 16px", borderBottom:`1px solid ${t.border}` }}>
                  <span style={{ fontWeight:700, fontSize:13, color:t.text, flex:1 }}>
                    JOB QUEUE <span style={{ color:t.text3, fontWeight:400 }}>(12)</span>
                  </span>
                  <button style={{ background:"none", border:"none", cursor:"pointer", color:t.text3, fontSize:16, marginRight:8 }}>⋯</button>
                  <button style={{ background:"none", border:"none", cursor:"pointer", color:"#1d4ed8", fontSize:12, fontWeight:600 }}>View All</button>
                </div>
                {JOBS_MOCK.map(j => {
                  const s = SCRIPTS.find(s=>s.key===j.key)||{icon:"📄",color:"#6b7280",bg:"#f9fafb"};
                  return (
                    <div key={j.id} style={{
                      display:"flex", alignItems:"center", gap:10, padding:"10px 16px",
                      borderBottom:`1px solid ${t.border}`,
                      transition:"background 0.1s",
                    }}
                    onMouseEnter={e=>e.currentTarget.style.background=t.surface2}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <StatusDot status={j.status}/>
                      <ScriptIcon script={s} size={26} t={t}/>
                      <span style={{ flex:1, fontSize:13, color:t.text, fontWeight:500 }}>{j.label}</span>
                      <span style={{
                        fontSize:12, fontWeight:600,
                        color: j.status==="running" ? "#22c55e"
                             : j.status==="waiting_input" ? "#a855f7"
                             : "#f59e0b",
                      }}>
                        {j.status==="running" ? "Running" : j.status==="waiting_input" ? "Waiting Input" : "Queued"}
                      </span>
                      <span style={{ fontSize:11, color:t.text3, fontFamily:"'IBM Plex Mono',monospace" }}>{j.time}</span>
                    </div>
                  );
                })}
                <div style={{ padding:"10px 16px", textAlign:"center" }}>
                  <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:t.text2, display:"flex", alignItems:"center", gap:5, margin:"0 auto" }}>
                    +6 more jobs <span>▾</span>
                  </button>
                </div>
              </div>

              {/* Attention Center */}
              <div style={{
                background:t.surface, borderRadius:10,
                border:`1px solid ${t.border}`, overflow:"hidden",
                boxShadow:t.shadow,
              }}>
                <div style={{ display:"flex", alignItems:"center", padding:"12px 16px", borderBottom:`1px solid ${t.border}` }}>
                  <span style={{ fontWeight:700, fontSize:13, color:t.text, flex:1 }}>
                    ATTENTION CENTER <span style={{ color:t.text3, fontWeight:400 }}>(3)</span>
                  </span>
                  <button style={{ background:"none", border:"none", cursor:"pointer", color:"#1d4ed8", fontSize:12, fontWeight:600 }}>View All</button>
                </div>
                {ATTENTION_MOCK.map(a => {
                  const s = SCRIPTS.find(s=>s.key===a.key)||{icon:"📄",color:"#6b7280",bg:"#f9fafb"};
                  return (
                    <div key={a.id} style={{
                      display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
                      borderBottom:`1px solid ${t.border}`,
                    }}>
                      <ScriptIcon script={s} size={34} t={t}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:13, color:t.text }}>{a.label}</div>
                        <div style={{
                          fontSize:12,
                          color: a.status==="waiting" ? "#a855f7" : "#ef4444",
                          fontWeight:500,
                        }}>
                          {a.reason}
                        </div>
                        <div style={{ fontSize:11, color:t.text3, marginTop:1 }}>
                          {a.status==="waiting"?"Requested:":"Failed:"} {a.time}
                        </div>
                      </div>
                      <button style={{
                        padding:"6px 14px", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer",
                        border: a.status==="waiting" ? "1.5px solid #7c3aed" : "1.5px solid #ef4444",
                        background: "transparent",
                        color: a.status==="waiting" ? "#7c3aed" : "#ef4444",
                        whiteSpace:"nowrap",
                      }}>
                        {a.status==="waiting" ? "Provide Input" : "View Details"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Workspaces */}
            <div style={{ flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                <span style={{ fontWeight:700, fontSize:13, color:t.text, flex:1, letterSpacing:"0.06em" }}>
                  WORKSPACES
                </span>
                <button onClick={()=>setGridCols(2)} style={{
                  width:28, height:28, borderRadius:5, border:`1px solid ${t.border}`,
                  background: gridCols===2 ? t.surface2 : "transparent",
                  cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", color:t.text2,
                }}>⊞</button>
                <button onClick={()=>setGridCols(1)} style={{
                  width:28, height:28, borderRadius:5, border:`1px solid ${t.border}`,
                  background: gridCols===1 ? t.surface2 : "transparent",
                  cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", color:t.text2,
                }}>☰</button>
                <button onClick={()=>setShowLaunch(true)} style={{
                  display:"flex", alignItems:"center", gap:5,
                  padding:"5px 12px", borderRadius:7,
                  border:"none", background:"#1d4ed8",
                  color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer",
                }}>
                  + Add Workspace
                </button>
              </div>

              <div style={{
                display:"grid",
                gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                gap:14,
              }}>
                {workspaces.map(ws => (
                  <WorkspaceCard key={ws.id} ws={ws} t={t} onInput={handleInput}/>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* ═══ LAUNCH DIALOG ═══ */}
      {showLaunch && (
        <LaunchDialog
          t={t}
          onClose={()=>setShowLaunch(false)}
          onLaunch={(key)=>{
            const s = SCRIPTS.find(s=>s.key===key);
            if (s) {
              const newWs = {
                id: Date.now(),
                key,
                label: s.label,
                status: "running",
                subtitle: "Starting...",
                logs:[{ time: new Date().toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit",second:"2-digit"}), ok:null, text:"Initialising..." }],
              };
              setWorkspaces(prev=>[...prev, newWs]);
            }
          }}
        />
      )}
    </div>
  );
}
