import { useState, useRef, useEffect } from "react";

// ── Design tokens (duplicated from MomoCandieDAO to keep self-contained) ──
const C = {
  void:     "#050508",
  deep:     "#0a0a14",
  panel:    "#0d0d1a",
  border:   "#1a1a2e",
  pink:     "#ff0077",
  pinkDim:  "#cc0055",
  cyan:     "#00f5ff",
  cyanDim:  "#00b8bf",
  acid:     "#b8ff00",
  acidDim:  "#8acc00",
  cream:    "#f0e6d3",
  muted:    "#5a5a7a",
  ghost:    "#2a2a3e",
};

// ── Agent metadata ─────────────────────────────────────────────────
const AGENTS = [
  {
    id:       "data",
    label:    "DATA AGENT",
    subtitle: "DefiLlama · Live APY / TVL",
    color:    C.cyan,
    icon:     "◈",
  },
  {
    id:       "risk",
    label:    "RISK AGENT",
    subtitle: "IL · Drawdown · Protocol Risk",
    color:    C.pink,
    icon:     "◉",
  },
  {
    id:       "timing",
    label:    "TIMING AGENT",
    subtitle: "Lunar Phase · RSI · MACD",
    color:    C.acid,
    icon:     "◎",
  },
  {
    id:       "synthesis",
    label:    "SYNTHESIS",
    subtitle: "Allocation · Action · Confidence",
    color:    "#bf94ff",
    icon:     "◆",
  },
];

// ── Status badge ───────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    idle:    { label: "IDLE",      bg: "transparent", color: C.muted,   border: C.ghost },
    running: { label: "RUNNING",   bg: "rgba(0,245,255,0.08)", color: C.cyan, border: C.cyanDim },
    done:    { label: "DONE",      bg: "rgba(184,255,0,0.08)", color: C.acid, border: C.acidDim },
    error:   { label: "ERROR",     bg: "rgba(255,0,119,0.08)", color: C.pink, border: C.pinkDim },
  };
  const s = map[status] || map.idle;
  return (
    <span style={{
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: "8px",
      letterSpacing: "2px",
      padding: "2px 7px",
      border: `1px solid ${s.border}`,
      color: s.color,
      background: s.bg,
    }}>
      {s.label}
    </span>
  );
}

// ── Individual agent panel ─────────────────────────────────────────
function AgentPanel({ agent, state }) {
  const { text, status } = state;
  const endRef = useRef(null);

  useEffect(() => {
    if (status === "running") endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [text, status]);

  return (
    <div style={{
      background: C.panel,
      border: `1px solid ${status === "running" ? agent.color : C.border}`,
      padding: "14px 16px",
      position: "relative",
      transition: "border-color 0.3s",
      boxShadow: status === "running" ? `0 0 20px ${agent.color}22` : "none",
    }}>
      {/* Top accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: `linear-gradient(90deg, transparent, ${agent.color}88, transparent)`,
        opacity: status === "running" ? 1 : 0.3,
        transition: "opacity 0.3s",
      }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "18px", color: agent.color,
            textShadow: status === "running" ? `0 0 10px ${agent.color}` : "none",
            transition: "text-shadow 0.3s" }}>
            {agent.icon}
          </span>
          <div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "9px", letterSpacing: "3px",
              color: agent.color }}>
              {agent.label}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px",
              color: C.muted, letterSpacing: "1px", marginTop: 2 }}>
              {agent.subtitle}
            </div>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Output area */}
      <div style={{
        minHeight: 60,
        maxHeight: 180,
        overflowY: "auto",
        borderLeft: `2px solid ${status === "idle" ? C.ghost : agent.color}44`,
        paddingLeft: 12,
        transition: "border-color 0.3s",
      }}>
        {status === "idle" && !text && (
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px",
            color: C.muted, lineHeight: 1.8 }}>
            {`> awaiting invocation...`}
          </div>
        )}
        {(text || status === "running") && (
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "11px",
            color: C.cream,
            lineHeight: 1.8,
            whiteSpace: "pre-wrap",
          }}>
            {text}
            {status === "running" && (
              <span style={{ color: agent.color, animation: "blink 1s step-end infinite" }}>█</span>
            )}
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}

// ── Progress pipeline bar ─────────────────────────────────────────
function PipelineBar({ agentStates }) {
  const order = ["data", "risk", "timing", "synthesis"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 20 }}>
      {order.map((id, i) => {
        const agent = AGENTS.find(a => a.id === id);
        const st = agentStates[id].status;
        const active = st === "running";
        const done   = st === "done";
        return (
          <div key={id} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{
              flex: 1,
              height: "2px",
              background: done ? agent.color : C.ghost,
              transition: "background 0.4s",
              display: i === 0 ? "none" : "block",
            }} />
            <div style={{
              width: 28, height: 28,
              border: `1px solid ${active || done ? agent.color : C.ghost}`,
              background: done ? `${agent.color}22` : C.deep,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Orbitron', monospace",
              fontSize: "11px",
              color: active || done ? agent.color : C.muted,
              boxShadow: active ? `0 0 12px ${agent.color}` : "none",
              transition: "all 0.3s",
              flexShrink: 0,
            }}>
              {done ? "✓" : agent.icon}
            </div>
            <div style={{
              flex: 1,
              height: "2px",
              background: done ? agent.color : C.ghost,
              transition: "background 0.4s",
              display: i === order.length - 1 ? "none" : "block",
            }} />
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────
const INIT_STATE = () => ({
  data:      { status: "idle", text: "" },
  risk:      { status: "idle", text: "" },
  timing:    { status: "idle", text: "" },
  synthesis: { status: "idle", text: "" },
});

export default function AiAgentOracle() {
  const [agentStates, setAgentStates] = useState(INIT_STATE);
  const [running, setRunning]         = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const esRef = useRef(null);

  function setAgent(id, patch) {
    setAgentStates(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function stop() {
    esRef.current?.close();
    setRunning(false);
  }

  function run() {
    if (running) return;
    setAgentStates(INIT_STATE());
    setGlobalError(null);
    setRunning(true);

    const es = new EventSource("/api/analyze");
    esRef.current = es;

    es.onmessage = (e) => {
      const evt = JSON.parse(e.data);

      if (evt.type === "agent_start") {
        setAgent(evt.agent, { status: "running", text: "" });
      } else if (evt.type === "token") {
        setAgent(evt.agent, (prev) => ({ text: (prev?.text || "") + evt.text }));
        // above is a function but setAgent doesn't support it directly — patch:
        setAgentStates(prev => ({
          ...prev,
          [evt.agent]: { ...prev[evt.agent], text: prev[evt.agent].text + evt.text },
        }));
      } else if (evt.type === "agent_done") {
        setAgent(evt.agent, { status: "done" });
      } else if (evt.type === "done") {
        setRunning(false);
        es.close();
      } else if (evt.type === "error") {
        setGlobalError(evt.message);
        setRunning(false);
        es.close();
      }
    };

    es.onerror = () => {
      setGlobalError("Connection to agent server lost. Is `npm run server` running?");
      setRunning(false);
      es.close();
    };
  }

  useEffect(() => () => esRef.current?.close(), []);

  const allDone = ["data", "risk", "timing", "synthesis"].every(
    id => agentStates[id].status === "done"
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "10px", letterSpacing: "4px",
            color: C.cyan, textShadow: `0 0 10px ${C.cyan}`, marginBottom: 4 }}>
            AI AGENT LAYER
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px",
            color: C.muted, letterSpacing: "1px" }}>
            4 × Claude Opus 4.6 · DefiLlama · Lunar API · Adaptive Thinking
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {running && (
            <button
              onClick={stop}
              style={{
                background: "transparent",
                border: `1px solid ${C.pinkDim}`,
                color: C.pink,
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "9px",
                letterSpacing: "1px",
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              ABORT
            </button>
          )}
          <button
            onClick={run}
            disabled={running}
            style={{
              background: running ? C.ghost : "transparent",
              border: `1px solid ${running ? C.ghost : C.cyan}`,
              color: running ? C.muted : C.cyan,
              fontFamily: "'Orbitron', monospace",
              fontSize: "9px",
              letterSpacing: "2px",
              padding: "8px 18px",
              cursor: running ? "default" : "pointer",
              textTransform: "uppercase",
              transition: "all 0.2s",
            }}
          >
            {running ? "ANALYZING..." : allDone ? "RE-ANALYZE" : "▶ INVOKE AGENTS"}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {globalError && (
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: "11px",
          color: C.pink,
          padding: "10px 14px",
          background: "rgba(255,0,119,0.06)",
          border: `1px solid ${C.pinkDim}`,
          marginBottom: 16,
        }}>
          ERROR: {globalError}
        </div>
      )}

      {/* Pipeline progress */}
      <PipelineBar agentStates={agentStates} />

      {/* Agent panels */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        {AGENTS.slice(0, 3).map(agent => (
          <AgentPanel key={agent.id} agent={agent} state={agentStates[agent.id]} />
        ))}

        {/* Timing spans both columns on mobile, single on desktop */}
        <div />
      </div>

      {/* Synthesis — full width */}
      <AgentPanel agent={AGENTS[3]} state={agentStates.synthesis} />

      {/* Legend */}
      <div style={{ marginTop: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
        {AGENTS.map(a => (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "8px",
              color: a.color }}>{a.icon}</span>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "8px",
              color: C.muted, letterSpacing: "1px" }}>{a.label}</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", fontFamily: "'Share Tech Mono', monospace",
          fontSize: "8px", color: C.muted }}>
          Start agent server: <span style={{ color: C.acid }}>npm run server</span>
        </div>
      </div>
    </div>
  );
}
