import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════
// MOMO CANDIE DAO — THE COUNCIL CHAMBER
// Cyberpunk-feminist governance interface
// Where the chain speaks and the council votes
// ═══════════════════════════════════════════════════════════════════

const COLORS = {
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

// ── Mock Data (replace with live API calls) ─────────────────────
const MOCK_WALLET       = "0x4f3B…c912";
const MOCK_POWER        = 847.32;
const MOCK_TOKENS       = 3;
const MOCK_RANK         = 142;
const MOCK_USDC_BALANCE = 1250.00;

const MOCK_PROPOSALS = [
  {
    id: "QmXv7k2",
    title: "Allocate 15% of Treasury to Turkish Manufacturing Partnership",
    body: "Fund Cycle 2 sensor integration with verified Istanbul manufacturer. Reduces COGS by 34% while maintaining ISO 13485 compliance for the Strawberry Protocol hardware layer.",
    choices: ["Yes — fund it", "No — hold treasury", "Abstain"],
    scores: [61.4, 28.2, 10.4],
    state: "active",
    ends: Date.now() + 172800000,
    votes: 1204,
    quorum: 40,
  },
  {
    id: "QmPx9w1",
    title: "Add Solana Cross-Chain Mirror for Governance Snapshots",
    body: "Mirror Ethereum holder snapshots to Solana via Wormhole bridge. Enables dual-chain governance participation without gas friction for Solana-native holders.",
    choices: ["Yes — bridge it", "No — ETH only", "Abstain"],
    scores: [74.8, 18.1, 7.1],
    state: "active",
    ends: Date.now() + 86400000,
    votes: 892,
    quorum: 40,
  },
  {
    id: "QmZa3e8",
    title: "Establish the Momo Candie Sonic DAO Committee",
    body: "Create a 7-member committee to curate QR-unlocked sonic experiences tied to cycle phase metadata. Committee elected by trait-weighted vote every 6 months.",
    choices: ["Yes — form it", "No — keep flat", "Revise scope"],
    scores: [89.2, 6.4, 4.4],
    state: "closed",
    ends: Date.now() - 86400000,
    votes: 2103,
    quorum: 40,
  },
];

const MOCK_TRAITS = [
  { trait: "Phase Aura", value: "Ovulation Crimson", rarity: 98.4, score: 262.1 },
  { trait: "Sensor Tier", value: "Quantum Mesh",     rarity: 94.2, score: 311.7 },
  { trait: "Frame",       value: "Void Lace",         rarity: 87.6, score: 273.5 },
];

const MOCK_STATS = {
  totalHolders:  2847,
  totalMinted:   4891,
  remaining:     359,
  whaleCount:    14,
  avgPerHolder:  1.72,
};

// ─────────────────────────────────────────────────────────────────

const css = `
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Exo+2:ital,wght@0,300;0,400;1,300&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: ${COLORS.void};
  color: ${COLORS.cream};
  font-family: 'Exo 2', sans-serif;
  min-height: 100vh;
  overflow-x: hidden;
}

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: ${COLORS.void}; }
::-webkit-scrollbar-thumb { background: ${COLORS.pinkDim}; }

.scanlines {
  position: fixed; inset: 0; pointer-events: none; z-index: 9999;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,0.08) 2px,
    rgba(0,0,0,0.08) 4px
  );
}

.noise {
  position: fixed; inset: 0; pointer-events: none; z-index: 9998; opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
}

.grid-bg {
  position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.04;
  background-image:
    linear-gradient(${COLORS.cyan} 1px, transparent 1px),
    linear-gradient(90deg, ${COLORS.cyan} 1px, transparent 1px);
  background-size: 40px 40px;
}

@keyframes glitch {
  0%, 90%, 100% { transform: translate(0); clip-path: none; }
  92% { transform: translate(-2px, 1px); clip-path: polygon(0 20%, 100% 20%, 100% 40%, 0 40%); color: ${COLORS.cyan}; }
  94% { transform: translate(2px, -1px); clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%); color: ${COLORS.pink}; }
  96% { transform: translate(0); clip-path: none; }
}

@keyframes pulse-border {
  0%, 100% { border-color: ${COLORS.border}; box-shadow: none; }
  50% { border-color: ${COLORS.pinkDim}; box-shadow: 0 0 20px rgba(255,0,119,0.15); }
}

@keyframes flicker {
  0%, 98%, 100% { opacity: 1; }
  99% { opacity: 0.7; }
}

@keyframes slide-in {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

.glitch  { animation: glitch 8s infinite; }
.flicker { animation: flicker 6s infinite; }
.slide-in { animation: slide-in 0.4s ease forwards; }

.panel {
  background: ${COLORS.panel};
  border: 1px solid ${COLORS.border};
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}

.panel::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, ${COLORS.pinkDim}, transparent);
  opacity: 0.6;
}

.panel-active { animation: pulse-border 3s ease infinite; }

.mono { font-family: 'Share Tech Mono', monospace; }
.orb  { font-family: 'Orbitron', monospace; }

.btn-primary {
  background: transparent;
  border: 1px solid ${COLORS.pink};
  color: ${COLORS.pink};
  font-family: 'Orbitron', monospace;
  font-size: 11px;
  letter-spacing: 2px;
  padding: 10px 20px;
  cursor: pointer;
  text-transform: uppercase;
  position: relative;
  overflow: hidden;
  transition: all 0.2s;
}

.btn-primary::before {
  content: '';
  position: absolute;
  inset: 0;
  background: ${COLORS.pink};
  transform: translateX(-101%);
  transition: transform 0.2s;
  z-index: -1;
}

.btn-primary:hover { color: ${COLORS.void}; }
.btn-primary:hover::before { transform: translateX(0); }

.btn-ghost {
  background: transparent;
  border: 1px solid ${COLORS.ghost};
  color: ${COLORS.muted};
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  letter-spacing: 1px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-ghost:hover { border-color: ${COLORS.cyanDim}; color: ${COLORS.cyan}; }

.tag {
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px;
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 1px;
}

.tag-active { background: rgba(184,255,0,0.1);  color: ${COLORS.acid}; border: 1px solid rgba(184,255,0,0.3); }
.tag-closed { background: rgba(90,90,122,0.2);   color: ${COLORS.muted}; border: 1px solid ${COLORS.ghost}; }
.tag-live   { background: rgba(255,0,119,0.1);   color: ${COLORS.pink}; border: 1px solid rgba(255,0,119,0.3); }

.vote-bar-track {
  height: 4px;
  background: ${COLORS.ghost};
  border-radius: 0;
  overflow: hidden;
  margin-top: 6px;
}

.vote-bar-fill {
  height: 100%;
  transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
}

.power-ring {
  position: relative;
  width: 120px; height: 120px;
  flex-shrink: 0;
}

.power-ring svg {
  animation: spin-slow 20s linear infinite;
}

.power-value {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.cursor-blink { animation: blink 1s step-end infinite; }

.oracle-output {
  border-left: 2px solid ${COLORS.pinkDim};
  padding-left: 16px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  line-height: 1.8;
  color: ${COLORS.cream};
  white-space: pre-wrap;
}

input, textarea {
  background: ${COLORS.deep};
  border: 1px solid ${COLORS.ghost};
  color: ${COLORS.cream};
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  padding: 10px 14px;
  outline: none;
  width: 100%;
  transition: border-color 0.2s;
}

input:focus, textarea:focus { border-color: ${COLORS.pinkDim}; }

.nav-item {
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: ${COLORS.muted};
  cursor: pointer;
  padding: 6px 0;
  transition: color 0.2s;
  border-bottom: 1px solid transparent;
}
.nav-item:hover { color: ${COLORS.cream}; }
.nav-item.active { color: ${COLORS.pink}; border-bottom-color: ${COLORS.pink}; }

.stat-block {
  display: flex; flex-direction: column; gap: 4px;
}
.stat-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px;
  letter-spacing: 2px;
  color: ${COLORS.muted};
  text-transform: uppercase;
}
.stat-value {
  font-family: 'Orbitron', monospace;
  font-size: 18px;
  font-weight: 700;
}

.corner-tl::before, .corner-tl::after,
.corner-br::before, .corner-br::after {
  content: '';
  position: absolute;
  width: 10px; height: 10px;
}
.corner-tl::before { top: -1px; left: -1px; border-top: 2px solid ${COLORS.pink}; border-left: 2px solid ${COLORS.pink}; }
.corner-br::after  { bottom: -1px; right: -1px; border-bottom: 2px solid ${COLORS.pink}; border-right: 2px solid ${COLORS.pink}; }

.proposal-card {
  transition: border-color 0.2s, box-shadow 0.2s;
}
.proposal-card:hover {
  border-color: ${COLORS.pinkDim};
  box-shadow: 0 0 30px rgba(255,0,119,0.08);
}

/* ── Withdraw Modal ─────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(5,5,8,0.92);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
  backdrop-filter: blur(4px);
}

.modal {
  width: 100%; max-width: 480px;
  background: ${COLORS.panel};
  border: 1px solid ${COLORS.pinkDim};
  border-radius: 2px;
  position: relative;
  box-shadow: 0 0 60px rgba(255,0,119,0.15);
  animation: slide-in 0.3s ease;
}

.modal::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, ${COLORS.pink}, ${COLORS.cyan}, transparent);
}

.step-dot {
  width: 8px; height: 8px; border-radius: 50%;
  border: 1px solid ${COLORS.ghost};
  background: ${COLORS.ghost};
  transition: all 0.3s;
}
.step-dot.done   { background: ${COLORS.pinkDim}; border-color: ${COLORS.pinkDim}; }
.step-dot.active { background: ${COLORS.pink}; border-color: ${COLORS.pink};
  box-shadow: 0 0 8px rgba(255,0,119,0.8); }

@keyframes confirm-pulse {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 1; }
}
.confirm-anim { animation: confirm-pulse 1.2s ease infinite; }

.toast {
  position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
  z-index: 20000;
  padding: 12px 28px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px; letter-spacing: 2px;
  border-radius: 2px;
  white-space: nowrap;
  animation: slide-in 0.3s ease;
}
.toast-success { background: rgba(184,255,0,0.1); border: 1px solid ${COLORS.acid}; color: ${COLORS.acid}; }
.toast-error   { background: rgba(255,0,119,0.1); border: 1px solid ${COLORS.pink}; color: ${COLORS.pink}; }
`;

// ── Helpers ───────────────────────────────────────────────────────

function timeRemaining(ms) {
  const s = Math.max(0, Math.floor((ms - Date.now()) / 1000));
  if (s <= 0) return "CLOSED";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 24 ? `${Math.floor(h / 24)}D ${h % 24}H` : `${h}H ${m}M`;
}

// Solana base58 address — 32-44 chars, no 0/O/I/l
function isValidSolanaAddress(addr) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr.trim());
}

function mockTxHash() {
  return Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
}

// ── WithdrawModal ─────────────────────────────────────────────────

const ASYNC_STEPS = ["signing", "broadcasting", "confirming", "api_call"];

function WithdrawModal({ balance, onClose, onSuccess }) {
  const [step, setStep]       = useState("amount");
  const [amount, setAmount]   = useState("");
  const [address, setAddress] = useState("");
  const [txHash, setTxHash]   = useState("");
  const [error, setError]     = useState("");
  const [dots, setDots]       = useState("");

  const isAsync = ASYNC_STEPS.includes(step);

  // Animate ellipsis during async steps
  useEffect(() => {
    if (!isAsync) return;
    const id = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 420);
    return () => clearInterval(id);
  }, [isAsync]);

  // Drive the async pipeline
  useEffect(() => {
    if (step === "signing")     { const t = setTimeout(() => setStep("broadcasting"), 1800); return () => clearTimeout(t); }
    if (step === "broadcasting"){ const t = setTimeout(() => setStep("confirming"),   1200); return () => clearTimeout(t); }
    if (step === "confirming")  {
      const delay = 3000 + Math.random() * 5000;
      const t = setTimeout(() => { setTxHash(mockTxHash()); setStep("api_call"); }, delay);
      return () => clearTimeout(t);
    }
    if (step === "api_call") {
      const t = setTimeout(() => { setStep("success"); onSuccess(parseFloat(amount), address); }, 1000);
      return () => clearTimeout(t);
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  function validateAmount() {
    const n = parseFloat(amount);
    if (!amount || isNaN(n)) return "Enter an amount";
    if (n < 1)        return "Minimum withdrawal is 1 USDC";
    if (n > balance)  return `Insufficient balance (max ${balance.toFixed(2)} USDC)`;
    return "";
  }

  function nextFromAmount() {
    const err = validateAmount();
    if (err) { setError(err); return; }
    setError(""); setStep("address");
  }

  function nextFromAddress() {
    if (!isValidSolanaAddress(address)) { setError("Invalid Solana address"); return; }
    setError(""); setStep("review");
  }

  // Step indicator: 5 visible nodes
  const IND = ["amount", "address", "review", "signing", "success"];
  const indIdx = isAsync ? IND.indexOf("signing") : IND.indexOf(step);

  const stepLabel = { amount: "STEP 1/5", address: "STEP 2/5", review: "STEP 3/5",
    signing: "STEP 4/5", broadcasting: "STEP 4/5", confirming: "STEP 4/5",
    api_call: "STEP 4/5", success: "COMPLETE" }[step];

  return (
    <div className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget && !isAsync && step !== "success") onClose(); }}>
      <div className="modal">

        {/* ── Modal header ── */}
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="orb" style={{ fontSize: "11px", letterSpacing: "4px", color: COLORS.cyan }}>
              WITHDRAW USDC
            </div>
            {!isAsync && step !== "success" && (
              <button onClick={onClose} style={{
                background: "none", border: "none", color: COLORS.muted,
                cursor: "pointer", fontSize: "20px", lineHeight: 1, padding: 0,
              }}>×</button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 16 }}>
            {IND.map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div className={`step-dot${i < indIdx ? " done" : i === indIdx ? " active" : ""}`} />
                {i < IND.length - 1 && (
                  <div style={{ width: 24, height: 1, background: i < indIdx ? COLORS.pinkDim : COLORS.ghost }} />
                )}
              </div>
            ))}
            <div className="mono" style={{ fontSize: "9px", color: COLORS.muted, letterSpacing: "2px", marginLeft: 8 }}>
              {stepLabel}
            </div>
          </div>
        </div>

        {/* ── Modal body ── */}
        <div style={{ padding: "24px" }}>

          {/* Step 1 — amount */}
          {step === "amount" && (
            <div className="slide-in">
              <div className="mono" style={{ fontSize: "9px", color: COLORS.muted, letterSpacing: "2px", marginBottom: 20, textTransform: "uppercase" }}>
                Enter withdrawal amount
              </div>
              <div style={{ position: "relative", marginBottom: 8 }}>
                <input type="number" value={amount} autoFocus min="1" step="0.01"
                  onChange={e => { setAmount(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && nextFromAmount()}
                  placeholder="0.00"
                  style={{ paddingRight: 60, fontSize: "18px" }}
                />
                <span className="mono" style={{
                  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  fontSize: "11px", color: COLORS.cyan, pointerEvents: "none",
                }}>USDC</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <span className="mono" style={{ fontSize: "10px", color: COLORS.muted }}>
                  Available: {balance.toFixed(2)} USDC
                </span>
                <button className="mono" onClick={() => { setAmount(balance.toFixed(2)); setError(""); }}
                  style={{ background: "none", border: "none", color: COLORS.cyan, cursor: "pointer", fontSize: "10px" }}>
                  MAX
                </button>
              </div>
              {error && <div className="mono" style={{ fontSize: "10px", color: COLORS.pink, marginBottom: 12 }}>{error}</div>}
              <button className="btn-primary" onClick={nextFromAmount} style={{ width: "100%" }}>
                Continue →
              </button>
            </div>
          )}

          {/* Step 2 — address */}
          {step === "address" && (
            <div className="slide-in">
              <div className="mono" style={{ fontSize: "9px", color: COLORS.muted, letterSpacing: "2px", marginBottom: 20, textTransform: "uppercase" }}>
                Destination Solana address
              </div>
              <input value={address} autoFocus
                onChange={e => { setAddress(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && nextFromAddress()}
                placeholder="e.g. 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
                style={{ marginBottom: 6 }}
              />
              <div className="mono" style={{ fontSize: "9px", color: COLORS.muted, marginBottom: 20 }}>
                Base58 · 32–44 chars · Solana mainnet only
              </div>
              {error && <div className="mono" style={{ fontSize: "10px", color: COLORS.pink, marginBottom: 12 }}>{error}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-ghost" onClick={() => { setStep("amount"); setError(""); }}>← Back</button>
                <button className="btn-primary" onClick={nextFromAddress} style={{ flex: 1 }}>Continue →</button>
              </div>
            </div>
          )}

          {/* Step 3 — review */}
          {step === "review" && (
            <div className="slide-in">
              <div className="mono" style={{ fontSize: "9px", color: COLORS.muted, letterSpacing: "2px", marginBottom: 20, textTransform: "uppercase" }}>
                Review & confirm
              </div>
              {[
                { label: "Amount",      val: `${parseFloat(amount).toFixed(2)} USDC`,
                  color: COLORS.acid,   extra: { fontSize: "20px", fontFamily: "Orbitron", fontWeight: 700 } },
                { label: "Network",     val: "Solana Mainnet",                         color: COLORS.cyan  },
                { label: "To",          val: `${address.slice(0,8)}…${address.slice(-6)}`, color: COLORS.cream },
                { label: "From",        val: MOCK_WALLET,                              color: COLORS.cream },
                { label: "Est. fee",    val: "< $0.001",                               color: COLORS.muted },
              ].map((r, i, arr) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${COLORS.ghost}` : "none",
                }}>
                  <span className="mono" style={{ fontSize: "10px", color: COLORS.muted, letterSpacing: "1px" }}>{r.label}</span>
                  <span className="mono" style={{ fontSize: "12px", color: r.color, ...(r.extra || {}) }}>{r.val}</span>
                </div>
              ))}
              <div className="mono" style={{
                fontSize: "9px", color: COLORS.muted, marginTop: 16, marginBottom: 20,
                padding: "10px 12px", background: COLORS.deep, border: `1px solid ${COLORS.ghost}`,
              }}>
                ◆ You will be prompted to sign in Phantom. This cannot be undone.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-ghost" onClick={() => setStep("address")}>← Back</button>
                <button className="btn-primary" onClick={() => setStep("signing")} style={{ flex: 1 }}>
                  Sign with Phantom →
                </button>
              </div>
            </div>
          )}

          {/* Steps 4–7 — async pipeline */}
          {isAsync && (
            <div className="slide-in" style={{ textAlign: "center", padding: "12px 0 4px" }}>
              <div style={{ marginBottom: 24 }}>
                {step === "signing" && <>
                  <div style={{ fontSize: "40px", marginBottom: 12 }}>👻</div>
                  <div className="orb" style={{ fontSize: "13px", color: COLORS.cream, marginBottom: 6 }}>Waiting for Phantom</div>
                  <div className="mono" style={{ fontSize: "11px", color: COLORS.muted }}>
                    Approve the transaction in your wallet<span className="confirm-anim">{dots}</span>
                  </div>
                </>}
                {step === "broadcasting" && <>
                  <div style={{ fontSize: "40px", marginBottom: 12 }}>📡</div>
                  <div className="orb" style={{ fontSize: "13px", color: COLORS.cream, marginBottom: 6 }}>Broadcasting</div>
                  <div className="mono" style={{ fontSize: "11px", color: COLORS.muted }}>
                    Sending to Solana network<span className="confirm-anim">{dots}</span>
                  </div>
                </>}
                {step === "confirming" && <>
                  <div style={{ fontSize: "40px", marginBottom: 12 }}>⛓</div>
                  <div className="orb" style={{ fontSize: "13px", color: COLORS.cyan, marginBottom: 6 }}>Confirming on-chain</div>
                  <div className="mono" style={{ fontSize: "11px", color: COLORS.muted }}>
                    Waiting for finality (5–30s)<span className="confirm-anim">{dots}</span>
                  </div>
                </>}
                {step === "api_call" && <>
                  <div style={{ fontSize: "40px", marginBottom: 12 }}>🔄</div>
                  <div className="orb" style={{ fontSize: "13px", color: COLORS.cream, marginBottom: 6 }}>Verifying with server</div>
                  <div className="mono" style={{ fontSize: "11px", color: COLORS.muted }}>
                    Updating balance & tax records<span className="confirm-anim">{dots}</span>
                  </div>
                </>}
              </div>

              {/* Pipeline progress trail */}
              <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
                {[
                  { id: "signing",      label: "SIGNED"    },
                  { id: "broadcasting", label: "SENT"      },
                  { id: "confirming",   label: "CONFIRMED" },
                  { id: "api_call",     label: "RECORDED"  },
                ].map(s => {
                  const cur = ASYNC_STEPS.indexOf(step);
                  const pos = ASYNC_STEPS.indexOf(s.id);
                  const done   = pos < cur;
                  const active = pos === cur;
                  return (
                    <div key={s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{
                        width: 7, height: 7, borderRadius: "50%",
                        background: done ? COLORS.acid : active ? COLORS.pink : COLORS.ghost,
                        boxShadow: active ? `0 0 10px ${COLORS.pink}` : "none",
                        transition: "all 0.4s",
                      }} />
                      <div className="mono" style={{
                        fontSize: "8px", letterSpacing: "1px",
                        color: done ? COLORS.acid : active ? COLORS.pink : COLORS.muted,
                      }}>{s.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 8 — success */}
          {step === "success" && (
            <div className="slide-in" style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{
                fontSize: "42px", color: COLORS.acid,
                textShadow: `0 0 30px ${COLORS.acid}`, marginBottom: 12,
              }}>✦</div>
              <div className="orb" style={{
                fontSize: "15px", fontWeight: 900, color: COLORS.acid,
                textShadow: `0 0 20px ${COLORS.acid}`, marginBottom: 8,
              }}>WITHDRAWAL COMPLETE</div>
              <div className="mono" style={{ fontSize: "12px", color: COLORS.cream, marginBottom: 20 }}>
                {parseFloat(amount).toFixed(2)} USDC sent to Solana
              </div>
              <div style={{
                padding: "10px 14px", background: COLORS.deep,
                border: `1px solid ${COLORS.ghost}`, marginBottom: 20, textAlign: "left",
              }}>
                <div className="mono" style={{ fontSize: "9px", color: COLORS.muted, letterSpacing: "2px", marginBottom: 4 }}>
                  TX HASH
                </div>
                <div className="mono" style={{ fontSize: "9px", color: COLORS.cyan, wordBreak: "break-all" }}>
                  {txHash}
                </div>
              </div>
              <button className="btn-primary" onClick={onClose} style={{ width: "100%" }}>
                Close ✓
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Components ────────────────────────────────────────────────────

function GlitchTitle() {
  return (
    <div style={{ textAlign: "center", padding: "0 0 4px" }}>
      <div className="orb glitch" style={{
        fontSize: "clamp(22px, 4vw, 38px)",
        fontWeight: 900,
        letterSpacing: "6px",
        color: COLORS.pink,
        textShadow: `0 0 40px rgba(255,0,119,0.6), 0 0 80px rgba(255,0,119,0.2)`,
        lineHeight: 1,
      }}>
        MOMO CANDIE
      </div>
      <div className="mono" style={{
        fontSize: "10px",
        letterSpacing: "8px",
        color: COLORS.cyanDim,
        marginTop: 8,
        textTransform: "uppercase",
      }}>
        DAO COUNCIL CHAMBER ◆ V1.0
      </div>
    </div>
  );
}

function PowerRing({ power, tokens }) {
  const radius = 50;
  const circ   = 2 * Math.PI * radius;
  const pct    = Math.min(power / 1500, 1);
  const dash   = pct * circ;

  return (
    <div className="power-ring">
      <svg viewBox="0 0 120 120" width="120" height="120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke={COLORS.ghost} strokeWidth="3" />
        <circle cx="60" cy="60" r={radius} fill="none"
          stroke={COLORS.pink} strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="square"
          style={{ transform: "rotate(-90deg)", transformOrigin: "center",
            filter: "drop-shadow(0 0 6px rgba(255,0,119,0.8))" }}
        />
        <circle cx="60" cy="60" r={40} fill="none" stroke={COLORS.ghost} strokeWidth="1" strokeDasharray="4 4" />
      </svg>
      <div className="power-value">
        <div className="orb" style={{ fontSize: "18px", fontWeight: 900, color: COLORS.pink,
          textShadow: "0 0 16px rgba(255,0,119,0.8)" }}>
          {power.toFixed(0)}
        </div>
        <div className="mono" style={{ fontSize: "8px", color: COLORS.muted, letterSpacing: "2px" }}>
          PWR
        </div>
        <div className="mono" style={{ fontSize: "10px", color: COLORS.acid, marginTop: 2 }}>
          {tokens}×NFT
        </div>
      </div>
    </div>
  );
}

function WalletPanel({ connected, onConnect, usdcBalance, onWithdraw, withdrawHistory }) {
  if (!connected) return (
    <div className="panel corner-tl corner-br" style={{ padding: "32px", textAlign: "center" }}>
      <div className="mono" style={{ fontSize: "10px", letterSpacing: "3px", color: COLORS.muted, marginBottom: 24, textTransform: "uppercase" }}>
        Connect your wallet to enter the council
      </div>
      <button className="btn-primary" onClick={onConnect}
        style={{ fontSize: "12px", padding: "14px 32px" }}>
        ◆ Connect Wallet
      </button>
      <div className="mono" style={{ fontSize: "9px", color: COLORS.muted, marginTop: 16, opacity: 0.6 }}>
        MetaMask / WalletConnect / Coinbase
      </div>
    </div>
  );

  return (
    <div className="panel panel-active corner-tl corner-br slide-in" style={{ padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
        <PowerRing power={MOCK_POWER} tokens={MOCK_TOKENS} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span className="tag tag-live">Connected</span>
            <span className="mono" style={{ fontSize: "11px", color: COLORS.cyan }}>
              {MOCK_WALLET}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
            <div className="stat-block">
              <div className="stat-label">Voting Power</div>
              <div className="stat-value" style={{ color: COLORS.pink, fontSize: 18 }}>{MOCK_POWER.toFixed(1)}</div>
            </div>
            <div className="stat-block">
              <div className="stat-label">Council Rank</div>
              <div className="stat-value" style={{ color: COLORS.acid, fontSize: 18 }}># {MOCK_RANK}</div>
            </div>
            <div className="stat-block">
              <div className="stat-label">Tokens Held</div>
              <div className="stat-value" style={{ color: COLORS.cyan, fontSize: 18 }}>{MOCK_TOKENS}</div>
            </div>
            <div className="stat-block">
              <div className="stat-label">USDC Balance</div>
              <div className="stat-value" style={{ color: COLORS.cream, fontSize: 18 }}>{usdcBalance.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Withdraw button */}
      <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
        <button className="btn-primary" onClick={onWithdraw}
          style={{ fontSize: "10px", padding: "8px 18px" }}
          disabled={usdcBalance < 1}>
          ◆ Withdraw USDC
        </button>
      </div>

      <div style={{ marginTop: 20, borderTop: `1px solid ${COLORS.border}`, paddingTop: 16 }}>
        <div className="mono" style={{ fontSize: "9px", color: COLORS.muted, letterSpacing: "2px", marginBottom: 10, textTransform: "uppercase" }}>
          Trait Frequency Analysis
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {MOCK_TRAITS.map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="mono" style={{ fontSize: "10px", color: COLORS.muted, width: 90, flexShrink: 0 }}>
                {t.trait}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span className="mono" style={{ fontSize: "10px", color: COLORS.cream }}>{t.value}</span>
                  <span className="mono" style={{ fontSize: "10px", color: COLORS.acid }}>+{t.score}</span>
                </div>
                <div className="vote-bar-track">
                  <div className="vote-bar-fill" style={{
                    width: `${t.rarity}%`,
                    background: `linear-gradient(90deg, ${COLORS.pink}, ${COLORS.cyan})`,
                  }} />
                </div>
              </div>
              <div className="mono" style={{ fontSize: "9px", color: COLORS.pink, width: 40, textAlign: "right", flexShrink: 0 }}>
                {t.rarity}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Withdrawal history */}
      {withdrawHistory.length > 0 && (
        <div style={{ marginTop: 20, borderTop: `1px solid ${COLORS.border}`, paddingTop: 16 }}>
          <div className="mono" style={{ fontSize: "9px", color: COLORS.muted, letterSpacing: "2px", marginBottom: 10, textTransform: "uppercase" }}>
            Withdrawal History
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {withdrawHistory.map((tx, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 10px", background: COLORS.deep, border: `1px solid ${COLORS.ghost}`,
              }}>
                <div>
                  <div className="mono" style={{ fontSize: "11px", color: COLORS.cream }}>
                    {tx.amount.toFixed(2)} USDC
                  </div>
                  <div className="mono" style={{ fontSize: "9px", color: COLORS.muted, marginTop: 2 }}>
                    {tx.address.slice(0, 8)}…{tx.address.slice(-6)} · {tx.time}
                  </div>
                </div>
                <div>
                  <span className="tag tag-active">✓ SENT</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProposalCard({ proposal, walletConnected }) {
  const [voted, setVoted]   = useState(null);
  const [scores, setScores] = useState(proposal.scores);
  const isActive  = proposal.state === "active";
  const barColors = [COLORS.pink, COLORS.cyan, COLORS.muted];

  function castVote(idx) {
    if (!walletConnected || !isActive || voted !== null) return;
    const newScores = [...scores];
    newScores[idx]  = +(newScores[idx] + 2.1).toFixed(1);
    const excess    = newScores[idx] - scores[idx];
    const other     = [0, 1, 2].filter(i => i !== idx);
    newScores[other[0]] = +(newScores[other[0]] - excess * 0.6).toFixed(1);
    newScores[other[1]] = +(newScores[other[1]] - excess * 0.4).toFixed(1);
    setScores(newScores);
    setVoted(idx);
  }

  return (
    <div className="panel proposal-card" style={{ padding: "20px", marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
            <span className={`tag ${isActive ? "tag-active" : "tag-closed"}`}>
              {isActive ? "ACTIVE" : "CLOSED"}
            </span>
            {isActive && (
              <span className="mono" style={{ fontSize: "9px", color: COLORS.muted, letterSpacing: "1px" }}>
                ends in {timeRemaining(proposal.ends)}
              </span>
            )}
            <span className="mono" style={{ fontSize: "9px", color: COLORS.muted }}>
              {proposal.votes.toLocaleString()} votes
            </span>
          </div>
          <div className="orb" style={{ fontSize: "13px", fontWeight: 700, color: COLORS.cream, letterSpacing: "1px", lineHeight: 1.4 }}>
            {proposal.title}
          </div>
        </div>
        <div className="mono" style={{ fontSize: "9px", color: COLORS.muted, flexShrink: 0 }}>
          {proposal.id}
        </div>
      </div>

      <div className="mono" style={{ fontSize: "11px", color: COLORS.muted, lineHeight: 1.7, marginBottom: 16 }}>
        {proposal.body}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {proposal.choices.map((choice, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <button
                onClick={() => castVote(i)}
                className="mono"
                style={{
                  background: voted === i ? `rgba(255,0,119,0.1)` : "transparent",
                  border: `1px solid ${voted === i ? COLORS.pink : COLORS.ghost}`,
                  color: voted === i ? COLORS.pink : COLORS.cream,
                  fontSize: "11px",
                  padding: "5px 12px",
                  cursor: isActive && walletConnected && !voted ? "pointer" : "default",
                  letterSpacing: "0.5px",
                  transition: "all 0.2s",
                  textAlign: "left",
                }}
              >
                {voted === i ? "▶ " : "  "}{choice}
              </button>
              <span className="mono" style={{ fontSize: "11px", color: barColors[i], minWidth: 40, textAlign: "right" }}>
                {scores[i]}%
              </span>
            </div>
            <div className="vote-bar-track">
              <div className="vote-bar-fill" style={{ width: `${scores[i]}%`, background: barColors[i] }} />
            </div>
          </div>
        ))}
      </div>

      {!walletConnected && isActive && (
        <div className="mono" style={{ fontSize: "9px", color: COLORS.muted, marginTop: 12, letterSpacing: "1px" }}>
          ◆ Connect wallet to cast your vote
        </div>
      )}
      {voted !== null && (
        <div className="mono slide-in" style={{ fontSize: "9px", color: COLORS.acid, marginTop: 12, letterSpacing: "2px" }}>
          ✦ VOTE RECORDED — POWER: {MOCK_POWER.toFixed(1)} UNITS CAST
        </div>
      )}
    </div>
  );
}

function OraclePanel() {
  const [query, setQuery]     = useState("");
  const [output, setOutput]   = useState("");
  const [loading, setLoading] = useState(false);

  const ORACLE_RESPONSES = {
    default: `ORACLE v1.0 — MOMO CANDIE DAO\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nConnected to Etherscan MCP layer.\nChain: Ethereum Mainnet (chainid=1)\nContract: 0xMOMO...CAND\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nAsk me anything about the collection,\nholder distribution, or governance state.`,
    holder:  `HOLDER PULSE — LIVE CHAIN STATE\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nTotal unique holders: 2,847\nTokens tracked: 4,891 / 5,250\n\nTOP WALLETS\nrank  address         tokens  pct\n001   0x4f3B…c912   142     2.90%  ⚠ WHALE\n002   0xa7F1…3e44   98      2.00%  ⚠ WHALE\n003   0x9c2D…8b71   67      1.37%  ⚠ WHALE\n004   0x1a4E…ff22   43      0.88%\n005   0x6b7C…0d19   38      0.78%\n\nGovernance risk: 14 wallets control 28.4%\nRecommendation: √ dampening active in voting`,
    whale:   `WHALE DETECTION — CONCENTRATION SCAN\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nThreshold: > 1% of 5,250 supply (52+ tokens)\n\n14 whale wallets detected\nCombined holdings: 1,391 tokens\nCombined voting power (raw): 28.43%\nCombined voting power (√): 16.21%\n\n√ DAMPENING ACTIVE — quadratic model\nreduces combined whale influence by 43%.\nCouncil power remains distributed.\n\nLargest single holder: 142 tokens (2.90%)`,
    gas:      `GAS ORACLE — ETHEREUM MAINNET\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nSlow:     12 Gwei  (~3min)\nStandard: 18 Gwei  (~30sec)\nFast:     24 Gwei  (~10sec)\n\nFor DAO proposal submission (est. 180k gas):\nStandard cost: ~$4.12 at current ETH price\n\nOptimal window: weekdays 02:00-06:00 UTC\nCurrent time: peak hours — costs elevated`,
    snapshot: `SNAPSHOT STRATEGY — whitelist-weighted\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nStrategy: whitelist-weighted  (NOT "csv")\nNetwork:  Ethereum Mainnet (chainid=1)\nSymbol:   VOTE\n\nConfig shape:\n{\n  "name": "whitelist-weighted",\n  "network": "1",\n  "params": {\n    "symbol": "VOTE",\n    "addresses": {\n      "0x4f3B...c912": 847.32,\n      "0xa7F1...3e44": 612.10\n    }\n  }\n}\n\nKey facts:\n• addresses = object {addr: weight}, not array\n• Weights may be integers or decimals\n• Case-insensitive (checksummed via ethers.js)\n• No on-chain calls — config-driven, instant\n• Max ~8 strategies per space (additive VP)\n• Settings freeze at proposal creation time\n\nScale guide:\n  < few thousand  → whitelist-weighted (inline)\n  medium lists    → whitelist-weighted-json (URL)\n  10,000+         → api-v2 (dynamic endpoint)\n\nTest first: snapshot.org/#/playground/whitelist-weighted`,
  };

  async function handleQuery() {
    if (!query.trim()) return;
    setLoading(true);
    setOutput("");

    let response = ORACLE_RESPONSES.default;
    const q = query.toLowerCase();
    if (q.includes("holder") || q.includes("distribution"))      response = ORACLE_RESPONSES.holder;
    else if (q.includes("whale") || q.includes("concentrat"))    response = ORACLE_RESPONSES.whale;
    else if (q.includes("gas"))                                   response = ORACLE_RESPONSES.gas;
    else if (q.includes("snapshot") || q.includes("strategy") || q.includes("whitelist") || q.includes("voting weight"))
                                                                  response = ORACLE_RESPONSES.snapshot;

    await new Promise(r => setTimeout(r, 800));

    let i = 0;
    const interval = setInterval(() => {
      setOutput(response.slice(0, i));
      i += 3;
      if (i >= response.length) {
        clearInterval(interval);
        setOutput(response);
        setLoading(false);
      }
    }, 16);
  }

  return (
    <div className="panel" style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div className="orb" style={{ fontSize: "10px", letterSpacing: "4px", color: COLORS.cyan,
          textShadow: `0 0 10px ${COLORS.cyan}` }}>
          DAO ORACLE
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <span className="tag tag-live">MCP LIVE</span>
          <span className="tag tag-active">ETH MAIN</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleQuery()}
          placeholder="ask the chain... (try 'snapshot strategy', 'whale detection', 'gas prices')"
          style={{ flex: 1 }}
        />
        <button className="btn-primary" onClick={handleQuery} disabled={loading}
          style={{ whiteSpace: "nowrap", opacity: loading ? 0.7 : 1 }}>
          {loading ? "..." : "INVOKE"}
        </button>
      </div>

      <div style={{ minHeight: 180 }}>
        {(output || loading) ? (
          <div className="oracle-output">
            {output}
            {loading && <span className="cursor-blink">█</span>}
          </div>
        ) : (
          <div className="mono" style={{ fontSize: "10px", color: COLORS.muted, lineHeight: 2 }}>
            {`> system ready\n> etherscan MCP: connected\n> awaiting invocation...`}
            <span className="cursor-blink" style={{ color: COLORS.pink }}>█</span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {["snapshot strategy", "holder distribution", "whale detection", "gas prices"].map(q => (
          <button key={q} className="btn-ghost" onClick={() => setQuery(q)}>
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function StatsBar() {
  return (
    <div className="panel" style={{
      padding: "14px 20px",
      display: "flex",
      gap: 24,
      flexWrap: "wrap",
      justifyContent: "space-between",
    }}>
      {[
        { label: "Total Holders", value: MOCK_STATS.totalHolders.toLocaleString(), color: COLORS.cream },
        { label: "Minted",        value: `${MOCK_STATS.totalMinted.toLocaleString()} / 5,250`, color: COLORS.acid },
        { label: "Remaining",     value: MOCK_STATS.remaining.toLocaleString(),    color: COLORS.cyan },
        { label: "Whales >1%",    value: MOCK_STATS.whaleCount,                    color: COLORS.pink },
        { label: "Avg / Holder",  value: MOCK_STATS.avgPerHolder,                  color: COLORS.cream },
      ].map((s, i) => (
        <div key={i} className="stat-block">
          <div className="stat-label">{s.label}</div>
          <div className="orb" style={{ fontSize: "15px", fontWeight: 700, color: s.color,
            textShadow: s.color === COLORS.pink ? "0 0 10px rgba(255,0,119,0.5)" : "none" }}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────

export default function MomoCandieDAO() {
  const [connected,       setConnected]       = useState(false);
  const [activeTab,       setActiveTab]       = useState("proposals");
  const [usdcBalance,     setUsdcBalance]     = useState(MOCK_USDC_BALANCE);
  const [showWithdraw,    setShowWithdraw]    = useState(false);
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [toast,           setToast]           = useState(null);
  const [_tick,           setTick]            = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  function handleWithdrawSuccess(amount, address) {
    setUsdcBalance(b => +(b - amount).toFixed(2));
    setWithdrawHistory(h => [{
      amount, address,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }, ...h]);
  }

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  const tabs = [
    { id: "proposals", label: "Proposals"  },
    { id: "wallet",    label: "My Seat"    },
    { id: "oracle",    label: "Oracle"     },
    { id: "stats",     label: "Collection" },
  ];

  return (
    <>
      <style>{css}</style>
      <div className="scanlines" />
      <div className="noise" />
      <div className="grid-bg" />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 820, margin: "0 auto", padding: "24px 16px 60px" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <GlitchTitle />
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
            <div className="mono" style={{ fontSize: "9px", color: COLORS.muted, letterSpacing: "3px" }}>
              5,250 TOKENS ◆ 873 TRAITS ◆ ETH MAINNET ◆ SQRT WEIGHTED GOVERNANCE
            </div>
          </div>
        </div>

        {/* Connect CTA (if not connected) */}
        {!connected && (
          <div style={{ marginBottom: 20 }}>
            <WalletPanel connected={false} onConnect={() => setConnected(true)}
              usdcBalance={usdcBalance} onWithdraw={() => setShowWithdraw(true)}
              withdrawHistory={withdrawHistory} />
          </div>
        )}

        {/* Connected wallet strip */}
        {connected && (
          <div style={{ marginBottom: 20 }}>
            <div className="panel slide-in" style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="tag tag-live">Connected</span>
                <span className="mono" style={{ fontSize: "11px", color: COLORS.cyan }}>{MOCK_WALLET}</span>
                <span className="mono" style={{ fontSize: "11px", color: COLORS.pink }}>
                  ◆ {MOCK_POWER.toFixed(1)} PWR
                </span>
              </div>
              <button className="btn-ghost" style={{ fontSize: "9px" }} onClick={() => setConnected(false)}>
                Disconnect
              </button>
            </div>
          </div>
        )}

        {/* Stats bar */}
        <div style={{ marginBottom: 20 }}>
          <StatsBar />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 24, borderBottom: `1px solid ${COLORS.border}`, marginBottom: 20 }}>
          {tabs.map(tab => (
            <div key={tab.id}
              className={`nav-item ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </div>
          ))}
        </div>

        {/* Tab Content */}
        <div className="slide-in" key={activeTab}>
          {activeTab === "proposals" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className="mono" style={{ fontSize: "10px", color: COLORS.muted, letterSpacing: "2px" }}>
                  {MOCK_PROPOSALS.filter(p => p.state === "active").length} ACTIVE ◆ {MOCK_PROPOSALS.filter(p => p.state === "closed").length} CLOSED
                </div>
                {connected && (
                  <button className="btn-primary" style={{ fontSize: "9px", padding: "7px 14px" }}>
                    + New Proposal
                  </button>
                )}
              </div>
              {MOCK_PROPOSALS.map(p => (
                <ProposalCard key={p.id} proposal={p} walletConnected={connected} />
              ))}
            </div>
          )}

          {activeTab === "wallet" && (
            <div>
              {connected
                ? <WalletPanel connected={true} onConnect={() => {}}
                    usdcBalance={usdcBalance} onWithdraw={() => setShowWithdraw(true)}
                    withdrawHistory={withdrawHistory} />
                : (
                  <div style={{ textAlign: "center", padding: "48px 0" }}>
                    <div className="mono" style={{ color: COLORS.muted, fontSize: "12px", marginBottom: 20 }}>
                      Connect your wallet to see your council seat
                    </div>
                    <button className="btn-primary" onClick={() => setConnected(true)}>◆ Connect Wallet</button>
                  </div>
                )
              }
            </div>
          )}

          {activeTab === "oracle" && <OraclePanel />}

          {activeTab === "stats" && (
            <div className="panel" style={{ padding: "24px" }}>
              <div className="orb" style={{ fontSize: "10px", letterSpacing: "4px", color: COLORS.acid, marginBottom: 20,
                textShadow: `0 0 10px ${COLORS.acid}` }}>
                COLLECTION INTELLIGENCE
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                {[
                  { label: "Total Supply",     value: "5,250", color: COLORS.pink  },
                  { label: "Unique Holders",    value: "2,847", color: COLORS.cyan  },
                  { label: "Minted",            value: "4,891", color: COLORS.acid  },
                  { label: "Trait Types",       value: "873",   color: COLORS.cream },
                  { label: "Whale Wallets",     value: "14",    color: COLORS.pink  },
                  { label: "Avg Tokens/Holder", value: "1.72",  color: COLORS.cyan  },
                ].map((s, i) => (
                  <div key={i} style={{
                    padding: "14px 16px",
                    background: COLORS.deep,
                    border: `1px solid ${COLORS.ghost}`,
                  }}>
                    <div className="stat-label">{s.label}</div>
                    <div className="orb" style={{ fontSize: "22px", fontWeight: 900, color: s.color, marginTop: 4,
                      textShadow: s.color === COLORS.pink ? "0 0 16px rgba(255,0,119,0.5)" : "none" }}>
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 20 }}>
                <div className="mono" style={{ fontSize: "9px", letterSpacing: "2px", color: COLORS.muted, marginBottom: 14, textTransform: "uppercase" }}>
                  Holder Distribution
                </div>
                {[
                  { label: "1 token",    pct: 72, count: 2050 },
                  { label: "2-5 tokens", pct: 20, count: 569  },
                  { label: "6+ tokens",  pct: 8,  count: 228  },
                ].map((d, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span className="mono" style={{ fontSize: "11px", color: COLORS.cream }}>{d.label}</span>
                      <span className="mono" style={{ fontSize: "11px", color: COLORS.acid }}>{d.count.toLocaleString()} holders</span>
                    </div>
                    <div className="vote-bar-track" style={{ height: 6 }}>
                      <div className="vote-bar-fill" style={{
                        width: `${d.pct}%`,
                        background: [COLORS.cyan, COLORS.pink, COLORS.acid][i],
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 20, marginTop: 4 }}>
                <div className="mono" style={{ fontSize: "9px", letterSpacing: "2px", color: COLORS.muted, marginBottom: 12, textTransform: "uppercase" }}>
                  Voting Model
                </div>
                <div className="mono" style={{ fontSize: "11px", color: COLORS.cream, lineHeight: 2 }}>
                  <span style={{ color: COLORS.pink }}>Mode:</span> Square Root (√) Dampening<br/>
                  <span style={{ color: COLORS.pink }}>Formula:</span> Voting Power = √(Σ trait rarity scores)<br/>
                  <span style={{ color: COLORS.pink }}>Effect:</span> 2× tokens ≠ 2× power — distributes authority<br/>
                  <span style={{ color: COLORS.acid }}>Quorum:</span> 40% of supply required to pass proposals<br/>
                  <span style={{ color: COLORS.cyan }}>Snapshot:</span> strategy{" "}
                  <span style={{ color: COLORS.acid }}>whitelist-weighted</span>
                  {" "}— address→weight pairs, no on-chain calls<br/>
                  <span style={{ color: COLORS.cyan }}>Scale:</span> inline JSON → hosted JSON → api-v2 (10k+)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 40, textAlign: "center" }}>
          <div className="mono" style={{ fontSize: "9px", color: COLORS.muted, letterSpacing: "3px", lineHeight: 2.5 }}>
            MOMO CANDIE DAO ◆ CYBERPUNK-FEMINIST GOVERNANCE ◆ CHAIN: ETHEREUM MAINNET<br/>
            <span style={{ color: COLORS.pinkDim }}>MENSTRUAL SOVEREIGNTY THROUGH DECENTRALIZED INFRASTRUCTURE</span>
          </div>
        </div>
      </div>

      {/* Withdraw modal */}
      {showWithdraw && connected && (
        <WithdrawModal
          balance={usdcBalance}
          onClose={() => setShowWithdraw(false)}
          onSuccess={(amount, address) => {
            handleWithdrawSuccess(amount, address);
            showToast(`✦ ${amount.toFixed(2)} USDC sent to Solana`);
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </>
  );
}
